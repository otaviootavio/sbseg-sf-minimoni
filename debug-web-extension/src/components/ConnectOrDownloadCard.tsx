import ConnectMiniMoniWalletWithDropdown from "./ConnectMiniMoniWalletWithDropdown";
import DownloadLinks from "./DownloadLinks";

export const ConnectOrDownloadCard = () => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <ConnectMiniMoniWalletWithDropdown />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md flex flex-row">
        <div className="flex-1 flex-col">
          <p className="text-md font-bold">Don&apos;t have MiniMoni wallet?</p>
          <p className="text-xs font-light">
            You can download the MiniMoni wallet to perform payment by second!
          </p>
        </div>
        <DownloadLinks />
      </div>
    </div>
  );
};
