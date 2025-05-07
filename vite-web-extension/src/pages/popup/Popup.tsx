import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import GenerateHash from "./components/GenerateHash";
import HashManagement from "./components/HashManagement";
import HashChainDetail from "./components/HashChainDetail";
import { HashchainProvider } from "./context/HashChainContext";
import WebsiteList from "./components/WebsiteList";

export default function Popup() {
  return (
    <HashchainProvider>
      <Router>
        <div className="bg-gray-800 h-full w-full text-gray-200 overflow-auto">
          <nav className="bg-gray-900 p-4">
            <ul className="flex justify-center space-x-4">
              <li>
                <Link to="/generate" className="hover:text-indigo-400">
                  Generate Hash
                </Link>
              </li>
              <li>
                <Link to="/manage" className="hover:text-indigo-400">
                  Manage Hash
                </Link>
              </li>
              <li>
                <Link to="/authorized" className="hover:text-indigo-400">
                  Authorized Websites
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-4">
            <Routes>
              <Route path="/generate" element={<GenerateHash />} />
              <Route path="/manage" element={<HashManagement />} />
              <Route path="/hashchain/:key" element={<HashChainDetail />} />
              <Route path="/authorized" element={<WebsiteList />} />
              <Route path="*" element={<Navigate to="/manage" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </HashchainProvider>
  );
}
