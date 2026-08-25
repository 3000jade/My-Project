import { useState } from 'react';
import ActionConsole from '../../components/ui/ActionConsole';
import Button from '../../components/ui/Button';
import { mockUsers } from '../../utils/mockUsers';

export default function LoginPage() {
  const [logs, setLogs] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAction = (actionName, payloadData, route, method = 'POST') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      route,
      method,
      payload: { action: actionName, data: payloadData },
      timestamp
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    handleAction('LOGIN_ATTEMPT', { email }, '/api/auth/login');
  };

  const handleDemoLogin = (role) => {
    const user = mockUsers[role];
    setEmail(user.email);
    setPassword(user.password);
    handleAction(`DEMO_${role.toUpperCase()}_SELECTED`, { email: user.email }, 'client-side', 'UI');
  };

  return (
    <>
      <main className="min-h-screen pt-[100px] flex flex-col md:flex-row w-full bg-surface">
          {/* Left Section: High-end luxury real estate image */}
          <section className="hidden md:flex md:w-1/2 relative overflow-hidden">
              <img 
                alt="Luxurious Modern Villa" 
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-tertiary/20 to-tertiary/60 pointer-events-none"></div>
              <div className="absolute bottom-12 left-12 right-12 z-10">
                  <span className="text-xs font-bold font-sans text-accent uppercase tracking-widest mb-4 block">
                    Elite Real Estate Intelligence
                  </span>
                  <h2 className="text-white font-display text-4xl md:text-5xl font-bold max-w-md drop-shadow-md leading-tight">
                    Securing generational wealth through predictive analytics.
                  </h2>
              </div>
          </section>
          
          {/* Right Section: Login Container */}
          <section className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative z-10 bg-surface">
              <div className="w-full max-w-[440px] flex flex-col">
                  
                  {/* Header */}
                  <div className="mb-10 text-center md:text-left">
                      <h2 className="text-4xl font-display font-bold text-tertiary mb-2">Welcome back.</h2>
                      <p className="text-base font-sans text-gray-500">Access your private portfolio and strategic market insights.</p>
                  </div>

                  {/* Demo Login Row */}
                  <div className="mb-8 p-5 bg-surface-container-low rounded-2xl border border-surface-container-high shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary font-sans mb-3 text-center">Quick Demo Access</p>
                      <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleDemoLogin('admin')}>
                              Admin
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDemoLogin('broker')}>
                              Broker
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDemoLogin('agent')}>
                              Agent
                          </Button>
                      </div>
                  </div>
                  
                  {/* Login Form */}
                  <form className="w-full space-y-6" onSubmit={handleLogin}>
                      <div className="space-y-2">
                          <label className="text-[11px] font-bold font-sans text-on-surface uppercase tracking-widest">Email Address</label>
                          <input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full h-14 px-5 border-none bg-surface-container-low rounded-[8px] focus:ring-2 focus:ring-primary transition-all text-sm font-sans outline-none text-tertiary"
                              placeholder="name@pt.com" 
                              type="email" 
                          />
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold font-sans text-on-surface uppercase tracking-widest">Password</label>
                              <button 
                                type="button" 
                                onClick={() => handleAction('FORGOT_PASSWORD_CLICKED', {}, '/api/auth/reset-password', 'GET')}
                                className="text-[11px] font-bold font-sans text-primary hover:text-accent transition-colors uppercase tracking-widest"
                              >
                                  Forgot password?
                              </button>
                          </div>
                          <div className="relative">
                              <input
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full h-14 px-5 border-none bg-surface-container-low rounded-[8px] focus:ring-2 focus:ring-primary transition-all text-sm font-sans outline-none text-tertiary pr-12"
                                  placeholder="••••••••" 
                                  type={showPassword ? "text" : "password"} 
                              />
                              <button
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                  type="button">
                                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                              </button>
                          </div>
                      </div>
                      <div className="pt-4">
                          <Button variant="primary" size="full" type="submit">
                              Login to Account
                          </Button>
                      </div>
                  </form>
                  
                  {/* Registration Links */}
                  <div className="mt-10 pt-8 border-t border-surface-container-high flex flex-col gap-6 items-center">
                      <p className="text-sm text-gray-500 font-sans">Don't have an account yet?</p>
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                          <button 
                              onClick={() => handleAction('CLIENT_ACCESS_CLICKED', {}, '/pages/auth/register-client', 'GET')}
                              className="text-xs font-bold font-sans text-primary hover:text-accent transition-colors flex items-center gap-2 uppercase tracking-widest"
                          >
                              <span className="material-symbols-outlined text-[18px]">person_add</span>
                              Client Access
                          </button>
                          <div className="hidden sm:block w-[1px] h-4 bg-outline-variant"></div>
                          <button 
                              onClick={() => handleAction('PARTNER_PORTAL_CLICKED', {}, '/pages/auth/register-partner', 'GET')}
                              className="text-xs font-bold font-sans text-primary hover:text-accent transition-colors flex items-center gap-2 uppercase tracking-widest"
                          >
                              <span className="material-symbols-outlined text-[18px]">business_center</span>
                              Partner Portal
                          </button>
                      </div>
                  </div>
              </div>
          </section>
      </main>
      
      {/* Dev Action Console overlay */}
      <ActionConsole 
        logs={logs} 
        onClear={() => setLogs([])} 
        position="bottom-left"
      />
    </>
  );
}
