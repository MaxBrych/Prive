import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import { Inter, Roboto } from "next/font/google";

export const metadata: Metadata = {
	title: "Bundlr Provenance Toolkit",
	description: "Components to rapidly develop strong provenance applications",
};

const roboto = Roboto({
	weight: "400",
	subsets: ["latin"],
	display: "swap",
});

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={roboto.className}>
			<Navbar />
			<body className={roboto.className}>{children}</body>
		</html>
	);
}