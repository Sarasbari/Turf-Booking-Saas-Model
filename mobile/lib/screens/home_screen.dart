import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../theme/app_theme.dart';
import '../services/turf_service.dart';
import '../services/favorites_service.dart';
import '../models/turf.dart';
import '../widgets/turf_card.dart';
import 'turf_detail_screen.dart';
import 'sign_in_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TurfService _turfService = TurfService();
  final FavoritesService _favService = FavoritesService();
  final TextEditingController _searchController = TextEditingController();

  String _searchQuery = '';
  String? _selectedSport;

  final List<Map<String, dynamic>> _sportFilters = [
    {'name': 'All', 'icon': Icons.sports},
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Volleyball', 'icon': Icons.sports_volleyball},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Tennis', 'icon': Icons.sports_tennis},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Turf> _filterTurfs(List<Turf> turfs) {
    return turfs.where((turf) {
      // Search filter
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = turf.name.toLowerCase().contains(query);
        final matchCity = turf.city.toLowerCase().contains(query);
        final matchArea = turf.area.toLowerCase().contains(query);
        if (!matchName && !matchCity && !matchArea) return false;
      }
      // Sport filter
      if (_selectedSport != null && _selectedSport != 'All') {
        if (!turf.sports.contains(_selectedSport)) return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Header ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user != null ? 'Hey, ${user.displayName?.split(' ').first ?? 'Player'}! 👋' : 'Hey, Player! 👋',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Find Your Turf',
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () {
                            if (user == null) {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const SignInScreen()));
                            }
                          },
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.accent]),
                              image: user?.photoURL != null
                                  ? DecorationImage(
                                      image: NetworkImage(user!.photoURL!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: user?.photoURL == null
                                ? const Icon(Icons.person, color: Colors.white, size: 22)
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Search Bar ──────────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                        border: Border.all(color: AppTheme.surfaceBorder),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search turfs, areas, cities...',
                          hintStyle: const TextStyle(color: AppTheme.textMuted),
                          prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted, size: 20),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close, size: 18, color: AppTheme.textMuted),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Sport Filters ───────────────────────────────
                    SizedBox(
                      height: 42,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _sportFilters.length,
                        itemBuilder: (context, index) {
                          final filter = _sportFilters[index];
                          final isActive = (_selectedSport == null && filter['name'] == 'All') ||
                              _selectedSport == filter['name'];

                          return Padding(
                            padding: EdgeInsets.only(right: index < _sportFilters.length - 1 ? 8 : 0),
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedSport = filter['name'] == 'All' ? null : filter['name'];
                                });
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                decoration: BoxDecoration(
                                  color: isActive ? AppTheme.primary : AppTheme.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isActive ? AppTheme.primary : AppTheme.surfaceBorder,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      filter['icon'] as IconData,
                                      size: 16,
                                      color: isActive ? Colors.white : AppTheme.textSecondary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      filter['name'] as String,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: isActive ? Colors.white : AppTheme.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),

            // ── Turf List ────────────────────────────────────────
            StreamBuilder<List<Turf>>(
              stream: _turfService.getTurfs(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                  );
                }

                if (snapshot.hasError) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                          const SizedBox(height: 12),
                          Text(
                            'Failed to load turfs',
                            style: TextStyle(color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final turfs = _filterTurfs(snapshot.data ?? []);

                if (turfs.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.sports_soccer, size: 64, color: AppTheme.textMuted),
                          const SizedBox(height: 12),
                          const Text(
                            'No turfs found',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Try a different search or filter',
                            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final turf = turfs[index];

                        return StreamBuilder<bool>(
                          stream: user != null
                              ? _favService.isFavorited(user.uid, turf.id)
                              : Stream.value(false),
                          builder: (context, favSnap) {
                            return TurfCard(
                              turf: turf,
                              isFavorited: favSnap.data ?? false,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => TurfDetailScreen(turfId: turf.id),
                                  ),
                                );
                              },
                              onFavoriteTap: () {
                                if (user == null) {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const SignInScreen()));
                                  return;
                                }
                                if (favSnap.data == true) {
                                  _favService.removeFavorite(user.uid, turf.id);
                                } else {
                                  _favService.addFavorite(user.uid, turf.id);
                                }
                              },
                            );
                          },
                        );
                      },
                      childCount: turfs.length,
                    ),
                  ),
                );
              },
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}
