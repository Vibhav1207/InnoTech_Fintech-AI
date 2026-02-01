import '../styles/globals.css';
import Layout from '../components/Layout';
import { AgentProvider } from '../context/AgentContext';

function MyApp({ Component, pageProps }) {
  return (
    <AgentProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AgentProvider>
  );
}

export default MyApp;
