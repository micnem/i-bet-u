import { Check, Copy, Download, Link, Mail, Share2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useId, useRef, useState } from "react";
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
	const [showSharePopover, setShowSharePopover] = useState(false);
	const popoverRef = useRef<HTMLDivElement>(null);
	const qrCodeId = useId();

	// Close popover when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				popoverRef.current &&
				!popoverRef.current.contains(event.target as Node)
			) {
				setShowSharePopover(false);
			}
		};

		if (showSharePopover) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showSharePopover]);

	const handleCopy = async () => {
		const success = await copyToClipboard(value);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleNativeShare = async () => {
		if (shareData) {
			await shareLink(shareData);
		} else {
			await shareLink({
				title: title || "IBetU",
				text: description || "Check this out on IBetU!",
				url: value,
			});
		}
		setShowSharePopover(false);
	};

	const shareText =
		shareData?.text || description || "Check this out on IBetU!";
	const shareTitle = shareData?.title || title || "IBetU";
	const shareUrl = shareData?.url || value;

	const handleWhatsAppShare = () => {
		const text = encodeURIComponent(`${shareText} ${shareUrl}`);
		window.open(`https://wa.me/?text=${text}`, "_blank");
		setShowSharePopover(false);
	};

	const handleTwitterShare = () => {
		const text = encodeURIComponent(shareText);
		const url = encodeURIComponent(shareUrl);
		window.open(
			`https://twitter.com/intent/tweet?text=${text}&url=${url}`,
			"_blank",
		);
		setShowSharePopover(false);
	};

	const handleFacebookShare = () => {
		const url = encodeURIComponent(shareUrl);
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${url}`,
			"_blank",
		);
		setShowSharePopover(false);
	};

	const handleEmailShare = () => {
		const subject = encodeURIComponent(shareTitle);
		const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
		window.location.href = `mailto:?subject=${subject}&body=${body}`;
		setShowSharePopover(false);
	};

	const handleDownload = () => {
		const svg = document.getElementById(qrCodeId);
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const svgBlob = new Blob([svgData], {
			type: "image/svg+xml;charset=utf-8",
		});
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
					id={qrCodeId}
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
					type="button"
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

				<div className="relative" ref={popoverRef}>
					<button
						type="button"
						onClick={() => setShowSharePopover(!showSharePopover)}
						className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium text-white transition-colors"
					>
						<Share2 size={16} />
						Share
					</button>

					{showSharePopover && (
						<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
							{/* Arrow */}
							<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />

							{/* Header */}
							<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
								<h4 className="font-semibold text-gray-800">Share Link</h4>
								<button
									type="button"
									onClick={() => setShowSharePopover(false)}
									className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								>
									<X size={16} className="text-gray-500" />
								</button>
							</div>

							{/* Link Display */}
							<div className="px-4 py-3 border-b border-gray-100">
								<div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
									<Link size={14} className="text-gray-400 flex-shrink-0" />
									<p className="text-xs text-gray-600 truncate flex-1">
										{shareUrl}
									</p>
									<button
										type="button"
										onClick={handleCopy}
										className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
										title="Copy link"
									>
										{copied ? (
											<Check size={14} className="text-green-500" />
										) : (
											<Copy size={14} className="text-gray-500" />
										)}
									</button>
								</div>
							</div>

							{/* Social Share Options */}
							<div className="p-3 space-y-1">
								<button
									type="button"
									onClick={handleWhatsAppShare}
									className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
								>
									<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
										<svg
											className="w-4 h-4 text-white"
											fill="currentColor"
											viewBox="0 0 24 24"
											role="img"
											aria-label="WhatsApp"
										>
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
										</svg>
									</div>
									<span className="text-sm font-medium text-gray-700">
										WhatsApp
									</span>
								</button>

								<button
									type="button"
									onClick={handleTwitterShare}
									className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
								>
									<div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
										<svg
											className="w-4 h-4 text-white"
											fill="currentColor"
											viewBox="0 0 24 24"
											role="img"
											aria-label="X"
										>
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</div>
									<span className="text-sm font-medium text-gray-700">
										X (Twitter)
									</span>
								</button>

								<button
									type="button"
									onClick={handleFacebookShare}
									className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
								>
									<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
										<svg
											className="w-4 h-4 text-white"
											fill="currentColor"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Facebook"
										>
											<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
										</svg>
									</div>
									<span className="text-sm font-medium text-gray-700">
										Facebook
									</span>
								</button>

								<button
									type="button"
									onClick={handleEmailShare}
									className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
								>
									<div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
										<Mail size={16} className="text-white" />
									</div>
									<span className="text-sm font-medium text-gray-700">
										Email
									</span>
								</button>

								{navigator?.share && (
									<button
										type="button"
										onClick={handleNativeShare}
										className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
									>
										<div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
											<Share2 size={16} className="text-white" />
										</div>
										<span className="text-sm font-medium text-gray-700">
											More options...
										</span>
									</button>
								)}
							</div>
						</div>
					)}
				</div>

				<button
					type="button"
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
