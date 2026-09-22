import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const requiredRoles = location.state?.requiredRoles || ['broker', 'admin'];
  const currentRole = location.state?.currentRole || user?.role || 'client';

  const handleReturnToSafeZone = () => {
    if (currentRole === 'agent') {
      navigate('/agent/dashboard');
    } else if (currentRole === 'broker' || currentRole === 'admin') {
      navigate('/broker/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen pt-[120px] pb-20 px-6 flex flex-col items-center justify-center bg-surface text-on-surface">
      <div className="w-full max-w-lg p-8 md:p-12 bg-surface-container-low rounded-[2rem] border border-surface-container-high shadow-xl text-center flex flex-col items-center">
        
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[32px]">shield_lock</span>
        </div>

        <span className="text-[11px] font-bold font-sans uppercase tracking-widest text-red-500 mb-2 block">
          Access Restricted • HTTP 403
        </span>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-tertiary mb-4">
          Restricted Portal Clearance
        </h1>

        <p className="text-sm font-sans text-gray-500 max-w-md mb-8 leading-relaxed">
          Your current account tier (<span className="font-semibold text-tertiary uppercase">{currentRole}</span>) lacks the executive security credentials required for this partition.
          This area requires clearance as <span className="font-semibold text-primary uppercase">{requiredRoles.join(' or ')}</span>.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={handleReturnToSafeZone}>
            Return to Workspace
          </Button>
          <Button variant="outline" size="md" onClick={handleSwitchAccount}>
            Sign in with Another Account
          </Button>
        </div>

        <p className="text-[11px] font-sans text-gray-400 mt-8">
          CP_kerby Security Protocol & RBAC Audit Engine
        </p>
      </div>
    </main>
  );
}
