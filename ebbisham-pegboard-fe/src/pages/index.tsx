import Head from 'next/head';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
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
