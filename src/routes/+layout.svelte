<script lang="ts">
  import "../app.css";
  import { onMount, onDestroy } from "svelte";
  import { supabase } from "$lib/supabase";
  import { user, profile, loading } from "$lib/stores/auth";
  import { theme } from "$lib/stores/theme";
  import { notifications, unreadCount, notificationChannel } from "$lib/stores/notifications";
  import type { Notification } from "$lib/stores/notifications";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import {
    Menu,
    X,
    Bell,
    User,
    LogOut,
    Home,
    Trophy,
    MessageCircle,
    Users,
    DollarSign,
    Settings,
    Download,
    LayoutDashboard,
    Check,
  } from "lucide-svelte";

  let rightMenuOpen = false;
  let leftMenuOpen = false;
  let notificationMenuOpen = false;
  let isMobile = false;

  onMount(() => {
    // Check viewport size
    isMobile = window.innerWidth <= 768;

    // Open left menu by default on desktop
    if (!isMobile) {
      leftMenuOpen = true;
    }

    window.addEventListener("resize", () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 768;

      // If switching to desktop, open left menu
      if (wasMobile && !isMobile) {
        leftMenuOpen = true;
      }
      // If switching to mobile, close both
      if (!wasMobile && isMobile) {
        rightMenuOpen = false;
        leftMenuOpen = false;
        notificationMenuOpen = false;
      }
    });

    // Get initial session
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        $user = session.user;
        await loadProfile(session.user.id);
        await loadNotifications();
        subscribeToNotifications();
      }
      $loading = false;
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      $user = session?.user ?? null;
      if (session?.user) {
        await loadProfile(session.user.id);
        await loadNotifications();
        subscribeToNotifications();
      } else {
        $profile = null;
        $notifications = [];
        $unreadCount = 0;
        if ($notificationChannel) {
          await supabase.removeChannel($notificationChannel);
          $notificationChannel = null;
        }
      }
    });

    return () => subscription.unsubscribe();
  });

  onDestroy(async () => {
    if ($notificationChannel) {
      await supabase.removeChannel($notificationChannel);
    }
  });

  async function loadProfile(userId: string) {
    console.log("Loading profile for user:", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    console.log("Profile loaded:", data);
    console.log("Profile load error:", error);
    console.log("is_admin value:", data?.is_admin);
    $profile = data;
  }

  async function handleLogout() {
    // Close all menus first to ensure clean UI state
    rightMenuOpen = false;
    leftMenuOpen = false;
    notificationMenuOpen = false;

    // Show goodbye screen, which will handle sign out and redirect
    goto("/auth/goodbye");
  }

  function toggleRightMenu() {
    rightMenuOpen = !rightMenuOpen;
  }

  function toggleLeftMenu() {
    leftMenuOpen = !leftMenuOpen;
  }

  function closeRightMenu() {
    rightMenuOpen = false;
  }

  function closeLeftMenu() {
    if (isMobile) leftMenuOpen = false;
  }

  function toggleNotificationMenu() {
    notificationMenuOpen = !notificationMenuOpen;
    if (notificationMenuOpen) {
      rightMenuOpen = false;
    }
  }

  function closeNotificationMenu() {
    notificationMenuOpen = false;
  }

  async function loadNotifications() {
    if (!$user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        from_profile:from_user_id (
          username,
          profile_image_url
        )
      `)
      .eq('user_id', $user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      $notifications = data;
      $unreadCount = data.filter(n => !n.read).length;
    }
  }

  function subscribeToNotifications() {
    if (!$user || $notificationChannel) return;

    const channel = supabase
      .channel(`notifications-${$user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${$user.id}`
      }, async (payload) => {
        // Load the notification with profile data
        const { data } = await supabase
          .from('notifications')
          .select(`
            *,
            from_profile:from_user_id (
              username,
              profile_image_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          $notifications = [data, ...$notifications];
          $unreadCount = $unreadCount + 1;
        }
      })
      .subscribe();

    $notificationChannel = channel;
  }

  async function markAsRead(notificationId: string) {
    if (!$user) return;

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ notificationId })
    });

    $notifications = $notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    $unreadCount = Math.max(0, $unreadCount - 1);
  }

  async function markAllAsRead() {
    if (!$user) return;

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    $notifications = $notifications.map(n => ({ ...n, read: true }));
    $unreadCount = 0;
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.link) {
      goto(notification.link);
      closeNotificationMenu();
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return Users;
      case 'chat_message':
        return MessageCircle;
      case 'level_up':
      case 'rank_up':
        return Trophy;
      default:
        return Bell;
    }
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-primary dark:bg-accent shadow-lg"
  >
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Left: Hamburger for left menu -->
      <button
        on:click={toggleLeftMenu}
        class="text-white p-2 hover:bg-white/10 rounded-lg transition"
      >
        <Menu size={24} />
      </button>

      <!-- Center: Logo/Title -->
      <a
        href="/"
        class="absolute left-1/2 transform -translate-x-1/2 font-rubik font-bold text-xl md:text-2xl text-white hover:scale-105 transition-transform"
        style="text-shadow: 2px 2px 0 #00008B, -2px -2px 0 #00008B, 2px -2px 0 #00008B, -2px 2px 0 #00008B;"
      >
        BLUEBALLS.LOL
      </a>

      <!-- Right: Notification Bell + Profile Picture/Icon -->
      <div class="flex items-center gap-2">
        {#if $user}
          <button
            on:click={toggleNotificationMenu}
            class="text-white p-2 hover:bg-white/10 rounded-lg transition relative"
            title="Notifications"
          >
            <Bell size={20} />
            {#if $unreadCount > 0}
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {$unreadCount > 9 ? '9+' : $unreadCount}
              </span>
            {/if}
          </button>
        {/if}
        <!-- Profile Picture or Empty Circle -->
        <button
          on:click={toggleRightMenu}
          class="hover:scale-110 transition-transform"
        >
          {#if $user && $profile?.profile_picture_url}
            <img
              src={$profile.profile_picture_url}
              alt="Profile"
              class="w-8 h-8 rounded-full border-2 border-white object-cover"
            />
          {:else if $user}
            <!-- Circle with initial -->
            <div
              class="w-8 h-8 rounded-full bg-secondary border-2 border-white flex items-center justify-center text-white font-bold text-sm"
            >
              {$profile?.username?.[0]?.toUpperCase() || "U"}
            </div>
          {:else}
            <!-- Empty circle for non-logged in users -->
            <div
              class="w-8 h-8 rounded-full border-2 border-white bg-white/20"
            ></div>
          {/if}
        </button>
      </div>
    </div>
  </header>

  <!-- Left Sidebar - Game Menu -->
  <aside
    class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-primary dark:bg-dark-secondary shadow-lg transition-transform z-40 overflow-y-auto {leftMenuOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <nav class="p-4 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-bold text-sm uppercase">Menu</h3>
        <button
          on:click={toggleLeftMenu}
          class="text-white hover:bg-white/10 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Game Modes Section -->
      <div>
        <h4 class="text-white/70 text-xs font-bold uppercase mb-2 px-2">
          Game Mode
        </h4>
        <div class="space-y-2">
          <a
            href="/game/easy"
            on:click={closeLeftMenu}
            class="block w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold text-sm"
          >
            Easy
          </a>
          <a
            href="/game/medium"
            on:click={closeLeftMenu}
            class="block w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition font-semibold text-sm"
          >
            Medium
          </a>
          <a
            href="/game/hard"
            on:click={closeLeftMenu}
            class="block w-full bg-secondary text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition font-semibold text-sm"
          >
            Hard
          </a>
        </div>
      </div>

      <!-- Ranking - Make it stand out -->
      <a
        href="/leaderboard"
        on:click={closeLeftMenu}
        class="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition font-bold text-center shadow-lg border-2 border-yellow-300"
      >
        <Trophy size={20} class="inline mr-2" />
        Ranking
      </a>

      <!-- Friends -->
      <a
        href="/friends"
        on:click={closeLeftMenu}
        class="block w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition font-semibold text-sm"
      >
        <Users size={18} class="inline mr-2" />
        Friends
      </a>

      <!-- Chat w Friends -->
      <a
        href="/chat/friends"
        on:click={closeLeftMenu}
        class="block w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition font-semibold text-sm"
      >
        <MessageCircle size={18} class="inline mr-2" />
        Chat w Friends
      </a>

      <!-- Global Chat -->
      <a
        href="/chat"
        on:click={closeLeftMenu}
        class="block w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition font-semibold text-sm"
      >
        <MessageCircle size={18} class="inline mr-2" />
        Global Chat
      </a>

      <!-- BB Club (Affiliate) -->
      <a
        href="/affiliate"
        on:click={closeLeftMenu}
        class="block w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition font-semibold text-sm"
      >
        <DollarSign size={18} class="inline mr-2" />
        BB Club
      </a>
    </nav>
  </aside>

  <!-- Right Panel - User Menu -->
  <aside
    class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-primary dark:bg-dark-secondary shadow-lg transition-transform z-40 overflow-y-auto {rightMenuOpen
      ? 'translate-x-0'
      : 'translate-x-full'}"
  >
    <nav class="p-4 space-y-2">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-bold text-sm uppercase">Menu</h3>
        <button
          on:click={toggleRightMenu}
          class="text-white hover:bg-white/10 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>
      {#if $user && $profile?.membership_tier !== "big"}
        <a
          href="/subscribe"
          on:click={closeRightMenu}
          class="block w-full bg-gradient-to-r from-secondary to-pink-600 text-white font-bold py-3 px-4 rounded-lg text-center hover:scale-105 transition-transform shadow-lg"
        >
          Upgrade Now
        </a>
      {/if}

      {#if $user}
        <a
          href="/dashboard"
          on:click={closeRightMenu}
          class="flex items-center gap-2 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition"
        >
          <LayoutDashboard size={18} /> Dashboard
        </a>
        <a
          href="/profile/{$user.id}"
          on:click={closeRightMenu}
          class="flex items-center gap-2 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition"
        >
          <User size={18} /> Profile
        </a>
        <a
          href="/settings"
          on:click={closeRightMenu}
          class="flex items-center gap-2 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition"
        >
          <Settings size={18} /> Settings
        </a>
      {/if}

      <button
        on:click={() => {
          window.alert("PWA Download: Add this app to your home screen!");
          closeRightMenu();
        }}
        class="flex items-center gap-2 w-full text-white py-3 px-4 rounded-lg hover:bg-white/10 transition bg-gradient-to-r from-yellow-500 to-orange-500 font-bold shadow-lg"
      >
        <Download size={18} /> Download App
      </button>

      {#if $user}
        <button
          on:click={handleLogout}
          class="flex items-center gap-2 w-full text-white py-2 px-4 rounded-lg hover:bg-red-600 transition mt-4"
        >
          <LogOut size={18} /> Logout
        </button>
      {:else}
        <a
          href="/auth/login"
          on:click={closeRightMenu}
          class="block w-full bg-secondary text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-pink-600 transition mt-4"
        >
          Login / Register
        </a>
      {/if}
    </nav>
  </aside>

  <!-- Notification Panel -->
  <aside
    class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 md:w-96 bg-white dark:bg-dark-secondary shadow-lg transition-transform z-40 overflow-y-auto {notificationMenuOpen
      ? 'translate-x-0'
      : 'translate-x-full'}"
  >
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg dark:text-white">Notifications</h3>
        <button
          on:click={closeNotificationMenu}
          class="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {#if $unreadCount > 0}
        <button
          on:click={markAllAsRead}
          class="w-full mb-4 text-sm text-primary dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
        >
          <Check size={16} />
          Mark all as read
        </button>
      {/if}

      <!-- Notifications List -->
      <div class="space-y-2">
        {#if $notifications.length === 0}
          <div class="text-center py-12 text-gray-500 dark:text-gray-400">
            <Bell size={48} class="mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        {:else}
          {#each $notifications as notification}
            {@const IconComponent = getNotificationIcon(notification.type)}
            <button
              on:click={() => handleNotificationClick(notification)}
              class="w-full text-left p-3 rounded-lg transition {notification.read
                ? 'bg-gray-50 dark:bg-dark-accent'
                : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary'} hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  {#if notification.from_profile?.profile_picture_url}
                    <img
                      src={notification.from_profile.profile_picture_url}
                      alt={notification.from_profile.username}
                      class="w-10 h-10 rounded-full object-cover"
                    />
                  {:else}
                    <div class="w-10 h-10 rounded-full bg-primary dark:bg-accent flex items-center justify-center">
                      <svelte:component this={IconComponent} size={20} class="text-white" />
                    </div>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm dark:text-white">{notification.message}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                {#if !notification.read}
                  <div class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 pt-16 pb-16 {leftMenuOpen && !isMobile ? 'ml-64' : ''} transition-all">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="bg-gray-100 dark:bg-dark-secondary border-t border-gray-200 dark:border-gray-700 py-4 {leftMenuOpen && !isMobile ? 'ml-64' : ''} transition-all mt-auto">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div class="text-center md:text-left">
          © {new Date().getFullYear()} BlueBalls.lol. All rights reserved.
        </div>
        <div class="flex items-center gap-4">
          <a href="/privacy" class="hover:text-primary dark:hover:text-blue-400 transition">
            Privacy Policy
          </a>
          <span class="text-gray-400">|</span>
          <a href="/terms" class="hover:text-primary dark:hover:text-blue-400 transition">
            Terms of Service
          </a>
          <span class="text-gray-400">|</span>
          <a href="mailto:hello@blueballs.lol" class="hover:text-primary dark:hover:text-blue-400 transition">
            Contact
          </a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Click outside to close menus -->
  {#if leftMenuOpen && isMobile}
    <button
      on:click={closeLeftMenu}
      class="fixed inset-0 bg-black/50 z-30"
      aria-label="Close menu"
    ></button>
  {/if}
  {#if rightMenuOpen}
    <button
      on:click={closeRightMenu}
      class="fixed inset-0 bg-black/{isMobile ? '50' : '30'} z-30"
      aria-label="Close menu"
    ></button>
  {/if}
  {#if notificationMenuOpen}
    <button
      on:click={closeNotificationMenu}
      class="fixed inset-0 bg-black/{isMobile ? '50' : '30'} z-30"
      aria-label="Close notifications"
    ></button>
  {/if}
</div>
