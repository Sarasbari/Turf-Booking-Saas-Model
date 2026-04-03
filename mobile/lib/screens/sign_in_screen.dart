import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

enum OwnerFlowStep { signIn, register, pending }

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen>
    with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _turfIdController = TextEditingController();
  final TextEditingController _claimCodeController = TextEditingController();

  bool _isLoading = false;
  SignInRole _selectedRole = SignInRole.customer;
  OwnerFlowStep _ownerStep = OwnerFlowStep.signIn;
  User? _ownerUser;
  String? _ownerError;
  late AnimationController _animController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeIn = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _slideUp = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
        );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _phoneController.dispose();
    _turfIdController.dispose();
    _claimCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogleSignIn() async {
    if (_selectedRole == SignInRole.owner) {
      await _handleOwnerGoogleSignIn();
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = await _authService.signInWithGoogle(
        role: SignInRole.customer,
      );
      if (user != null && mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Sign in failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleOwnerGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _ownerError = null;
    });

    try {
      final result = await _authService.signInOwnerWithGoogle();
      if (result == null || !mounted) return;

      if (result.status == OwnerAuthStatus.approved) {
        Navigator.of(context).pop(true);
        return;
      }

      setState(() {
        _ownerUser = result.user;
        _ownerStep = result.status == OwnerAuthStatus.pending
            ? OwnerFlowStep.pending
            : OwnerFlowStep.register;
        _ownerError = result.status == OwnerAuthStatus.notRegistered
            ? 'Not registered as owner yet. Complete registration below.'
            : null;
      });
    } catch (e) {
      if (mounted) {
        setState(
          () => _ownerError = e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleOwnerRegisterGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _ownerError = null;
    });

    try {
      final user = await _authService.signInWithGoogle(
        role: SignInRole.customer,
      );
      if (user != null && mounted) {
        setState(() => _ownerUser = user);
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _ownerError = e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleOwnerRegistrationSubmit() async {
    final phone = _phoneController.text.replaceAll(' ', '').trim();
    final turfId = _turfIdController.text.trim();
    final claimCode = _claimCodeController.text.trim();

    if (_ownerUser == null) {
      setState(() => _ownerError = 'Please sign in with Google first.');
      return;
    }
    if (!RegExp(r'^\d{10}$').hasMatch(phone)) {
      setState(() => _ownerError = 'Enter a valid 10-digit phone number.');
      return;
    }
    if (turfId.isEmpty) {
      setState(() => _ownerError = 'Enter your Turf ID.');
      return;
    }
    if (claimCode.isEmpty) {
      setState(() => _ownerError = 'Enter your claim code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _ownerError = null;
    });

    try {
      await _authService.registerOwner(
        phone: phone,
        turfId: turfId,
        claimCode: claimCode,
      );
      if (mounted) {
        setState(() => _ownerStep = OwnerFlowStep.pending);
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _ownerError = e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetOwnerFlow({bool signOut = false}) async {
    if (signOut) {
      await _authService.signOut();
    }
    if (!mounted) return;

    setState(() {
      _ownerStep = OwnerFlowStep.signIn;
      _ownerUser = null;
      _ownerError = null;
      _phoneController.clear();
      _turfIdController.clear();
      _claimCodeController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: FadeTransition(
            opacity: _fadeIn,
            child: SlideTransition(
              position: _slideUp,
              child: Column(
                children: [
                  const Spacer(),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 28,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(AppTheme.radiusL),
                      border: Border.all(color: AppTheme.surfaceBorder),
                    ),
                    child: Column(
                      children: [
                        // ── Logo ──────────────────────────────────────
                        Container(
                          width: 84,
                          height: 84,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(
                              AppTheme.radiusL,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withValues(alpha: 0.22),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.sports_soccer,
                            size: 44,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Title ─────────────────────────────────────
                        const Text(
                          'TurfBookaro',
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Book your favourite turf in seconds',
                          style: TextStyle(
                            fontSize: 15,
                            color: AppTheme.textSecondary,
                          ),
                        ),

                        const SizedBox(height: 28),

                        // ── Role Selector ─────────────────────────────
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(
                              AppTheme.radiusM,
                            ),
                            border: Border.all(color: AppTheme.surfaceBorder),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: _RoleOptionButton(
                                  label: 'User',
                                  icon: Icons.person_outline,
                                  isSelected:
                                      _selectedRole == SignInRole.customer,
                                  onTap: () => setState(() {
                                    _selectedRole = SignInRole.customer;
                                    _ownerError = null;
                                  }),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _RoleOptionButton(
                                  label: 'Owner',
                                  icon: Icons.storefront_outlined,
                                  isSelected: _selectedRole == SignInRole.owner,
                                  onTap: () => setState(() {
                                    _selectedRole = SignInRole.owner;
                                    _ownerStep = OwnerFlowStep.signIn;
                                    _ownerError = null;
                                  }),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),
                        if (_selectedRole == SignInRole.customer)
                          _buildCustomerSection()
                        else
                          _buildOwnerSection(),

                        if (_ownerError != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 14),
                            child: Text(
                              _ownerError!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppTheme.error,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'Skip for now',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ),

                  const Spacer(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerSection() {
    return Column(
      children: [
        ...[
          '⚡ Instant booking confirmation',
          '📍 Find turfs near you',
          '💳 Secure online payment',
        ].map(
          (text) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Text(
                  text.substring(0, 2),
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(width: 12),
                Text(
                  text.substring(3),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        _googleButton(
          label: 'Continue as User',
          onPressed: _isLoading ? null : _handleGoogleSignIn,
        ),
      ],
    );
  }

  Widget _buildOwnerSection() {
    if (_ownerStep == OwnerFlowStep.pending) {
      return Column(
        children: [
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
              border: Border.all(
                color: AppTheme.primary.withValues(alpha: 0.3),
              ),
            ),
            child: const Column(
              children: [
                Icon(
                  Icons.hourglass_top_rounded,
                  color: AppTheme.primary,
                  size: 32,
                ),
                SizedBox(height: 10),
                Text(
                  'Owner approval pending',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Your owner account is awaiting admin approval. You can sign in once approved.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _isLoading
                  ? null
                  : () => _resetOwnerFlow(signOut: true),
              child: const Text('Back'),
            ),
          ),
        ],
      );
    }

    if (_ownerStep == OwnerFlowStep.register) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Register as Turf Owner',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Sign in with Google, then verify Turf ID and claim code.',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 14),
          if (_ownerUser == null)
            _googleButton(
              label: 'Continue with Google',
              onPressed: _isLoading ? null : _handleOwnerRegisterGoogleSignIn,
            )
          else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(AppTheme.radiusM),
                border: Border.all(color: AppTheme.surfaceBorder),
              ),
              child: Text(
                'Google account: ${_ownerUser!.email ?? _ownerUser!.displayName ?? 'Signed in'}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                hintText: '10-digit mobile number',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _turfIdController,
              decoration: const InputDecoration(
                labelText: 'Turf ID',
                hintText: 'Enter assigned turf ID',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _claimCodeController,
              decoration: const InputDecoration(
                labelText: 'Claim Code',
                hintText: 'Enter claim code from admin',
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleOwnerRegistrationSubmit,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit for Approval'),
              ),
            ),
          ],
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: _isLoading
                  ? null
                  : () => _resetOwnerFlow(signOut: true),
              child: const Text('Back to Owner Sign In'),
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        const Text(
          'Owner Access',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Sign in with your registered owner Google account.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 16),
        _googleButton(
          label: 'Sign in as Owner',
          onPressed: _isLoading ? null : _handleOwnerGoogleSignIn,
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _isLoading
              ? null
              : () => setState(() {
                  _ownerError = null;
                  _ownerStep = OwnerFlowStep.register;
                }),
          child: const Text('Not registered as owner? Register now'),
        ),
      ],
    );
  }

  Widget _googleButton({
    required String label,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusM),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppTheme.primary,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'G',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF4285F4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _RoleOptionButton extends StatelessWidget {
  const _RoleOptionButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
