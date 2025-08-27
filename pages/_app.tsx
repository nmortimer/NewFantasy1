import type { AppProps } from 'next/app';
import '../styles/globals.css'; // IMPORTANT: relative path from /pages

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
