import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang='en'>
            <Head>
                <link rel='stylesheet' href='https://cdn.jsdelivr.net/gh/alohe/emojicloud/emojicloud.css' />
                <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css' />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
