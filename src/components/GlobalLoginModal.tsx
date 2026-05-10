import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/LoginModal";

const GlobalLoginModal = () => {
  const { loginModalOpen, setLoginModalOpen, pendingAuthAction } = useAuth();
  return (
    <LoginModal
      open={loginModalOpen}
      onOpenChange={setLoginModalOpen}
      onSuccess={() => pendingAuthAction?.()}
    />
  );
};

export default GlobalLoginModal;
