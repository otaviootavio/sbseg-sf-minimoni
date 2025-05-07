import { HashchainDebug } from "./components/HashchainDebug";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { rainbowKitConfig } from "../config";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-min-max p-10">
      <div className="container mx-auto px-4">
        <main>
          <WagmiProvider config={rainbowKitConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <HashchainDebug />
                <Toaster />
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </main>
      </div>
    </div>
  );
};

export default App;
