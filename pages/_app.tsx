import type { AppProps } from 'next/app';
import '../styles/globals.css'; // ← use relative path (no "@")

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
