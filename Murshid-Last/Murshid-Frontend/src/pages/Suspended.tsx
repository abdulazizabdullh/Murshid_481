import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useBlocker } from "react-router-dom";

const Suspended = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not logged in, go to login
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Block navigation and logout when user tries to go back
  useEffect(() => {
    const handlePopState = async (e: PopStateEvent) => {
      e.preventDefault();
      await logout();
      navigate("/login", { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [logout, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full border rounded-lg p-6 shadow-sm bg-card text-card-foreground">
        <div className="space-y-2 text-center">
          {user?.suspended_reason === 'Pending specialist verification' ? (
            <>
              <h1 className="text-2xl font-semibold">Account Under Review</h1>
              <p className="text-muted-foreground">
                Your specialist application is being reviewed by our administrators.
              </p>
              <p className="text-muted-foreground">
                You will receive an email notification once your account has been approved or if additional information is needed.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                This process typically takes 1-2 business days.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">Account Suspended</h1>
              {user?.suspended_reason ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground font-medium">Reason:</p>
                  <p className="text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    {user.suspended_reason}
                  </p>
                  {user?.suspended_until && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Suspended until: <span className="font-semibold">{new Date(user.suspended_until).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Your account has been suspended by an administrator. You cannot access the application at this time.
                </p>
              )}
              <p className="text-muted-foreground mt-4">
                Please contact support or your administrator if you believe this is a mistake.
              </p>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="destructive" onClick={handleLogout} id="suspended-logout-button">
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Suspended;
