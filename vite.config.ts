import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		devtools(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon-32.png", "logo192.png", "logo512.png"],
			// Disable service worker for Cloudflare Workers (edge caching handled differently)
			selfDestroying: true,
			manifest: {
				name: "IBetU - Friendly Betting",
				short_name: "IBetU",
				description: "Turn friendly wagers into unforgettable moments",
				theme_color: "#f97316",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "logo192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "logo512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "logo512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
});

export default config;
