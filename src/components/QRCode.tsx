import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Copy, Check, Share2, Download } from "lucide-react";
import { copyToClipboard, shareLink } from "../lib/sharing";

interface QRCodeDisplayProps {
	value: string;
	title?: string;
	description?: string;
	size?: number;
	shareData?: {
		title: string;
		text: string;
		url: string;
	};
}

export function QRCodeDisplay({
	value,
	title,
	description,
	size = 200,
	shareData,
}: QRCodeDisplayProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const success = await copyToClipboard(value);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleShare = async () => {
		if (shareData) {
			await shareLink(shareData);
		} else {
			await shareLink({
				title: title || "IBetU",
				text: description || "Check this out on IBetU!",
				url: value,
			});
		}
	};

	const handleDownload = () => {
		const svg = document.getElementById("qr-code-svg");
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
		const svgUrl = URL.createObjectURL(svgBlob);

		const downloadLink = document.createElement("a");
		downloadLink.href = svgUrl;
		downloadLink.download = "ibetu-qr-code.svg";
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		URL.revokeObjectURL(svgUrl);
	};

	return (
		<div className="flex flex-col items-center">
			{title && (
				<h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
			)}

			<div className="bg-white p-4 rounded-xl shadow-md">
				<QRCodeSVG
					id="qr-code-svg"
					value={value}
					size={size}
					level="H"
					includeMargin
					bgColor="#ffffff"
					fgColor="#000000"
				/>
			</div>

			{description && (
				<p className="text-sm text-gray-500 mt-3 text-center max-w-xs">
					{description}
				</p>
			)}

			<div className="flex gap-2 mt-4">
				<button
					onClick={handleCopy}
					className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
				>
					{copied ? (
						<>
							<Check size={16} className="text-green-500" />
							Copied!
						</>
					) : (
						<>
							<Copy size={16} />
							Copy Link
						</>
					)}
				</button>

				<button
					onClick={handleShare}
					className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium text-white transition-colors"
				>
					<Share2 size={16} />
					Share
				</button>

				<button
					onClick={handleDownload}
					className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
					title="Download QR Code"
				>
					<Download size={16} />
				</button>
			</div>

			<p className="text-xs text-gray-400 mt-3 break-all max-w-xs text-center">
				{value}
			</p>
		</div>
	);
}

// Compact QR code for inline display
export function QRCodeCompact({
	value,
	size = 120,
}: {
	value: string;
	size?: number;
}) {
	return (
		<div className="bg-white p-2 rounded-lg shadow-sm inline-block">
			<QRCodeSVG value={value} size={size} level="M" />
		</div>
	);
}
