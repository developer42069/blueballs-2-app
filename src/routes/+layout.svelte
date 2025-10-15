<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { user, profile, loading } from "$lib/stores/auth";
  import { theme } from "$lib/stores/theme";
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
  } from "lucide-svelte";

  let rightMenuOpen = false;
  let leftMenuOpen = false;
  let isMobile = false;

  onMount(async () => {
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
      }
    });

    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      $user = session.user;
      await loadProfile(session.user.id);
    }
    $loading = false;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      $user = session?.user ?? null;
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        $profile = null;
      }
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
    goto("/");
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

  function handleNotificationClick() {
    // Placeholder for notification functionality
    // Will be implemented in Phase 2
    alert("Notifications coming soon! 🔔");
  }
</script>

<div class="min-h-screen">
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
            on:click={handleNotificationClick}
            class="text-white p-2 hover:bg-white/10 rounded-lg transition relative"
            title="Notifications"
          >
            <Bell size={20} />
            <!-- Notification badge placeholder (will show count in Phase 2) -->
            <!-- <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span> -->
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

  <!-- Main Content -->
  <main class="pt-16 {leftMenuOpen && !isMobile ? 'ml-64' : ''} transition-all">
    <slot />
  </main>

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
</div>
