import '@/styles/globals.css';
import Nav from '../components/Nav';
import ContextWrapper from '../context/ContextWrapper';
import styles from '@/styles/Home.module.css';
import Footer from '../components/Footer';


export default function App({ Component, pageProps }) {
  return (
    <ContextWrapper>
      <div className={styles.landingpage}>
        <div className='h-full w-full bg-gray-100'>
          <Nav />
          <div className=''>
            <Component {...pageProps} />
          </div>
        </div>
      </div>
    </ContextWrapper>
  );
}
