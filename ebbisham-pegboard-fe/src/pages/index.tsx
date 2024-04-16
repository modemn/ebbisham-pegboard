import Head from 'next/head';
import { Inter } from 'next/font/google';
import { Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap';

const inter = Inter({ subsets: ['latin'] });

import { useGlobalStore } from '@utils/store';

export default function Home() {
    const [toastNotification] = useGlobalStore((state) => [state.toastNotification]);
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification]);
    return (
        <>
            <Head>
                <title>Ebbisham ePegboard</title>
                <meta name='description' content='An elem' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
            <main className={inter.className}>
                {/* TODO: Landing page */}
                <h1 className='text-center'>Ebbisham ePegboard</h1>
            </main>
        </>
    );
}
