import Head from 'next/head'
import { Inter } from 'next/font/google'
import { Col, Container, Row } from 'react-bootstrap'

const inter = Inter({ subsets: ['latin'] })

import styles from '@/styles/Home.module.css'
import PlayerList from '@/components/PlayerList/PlayerList'
import StopPlayerModal from '@/components/StopPlayerModal/StopPlayerModal'
import AddNewPlayerModal from '@/components/AddNewPlayerModal/AddNewPlayerModal'

export default function Home() {
  return (
    <>
      <Head>
        <title>Ebbisham ePegboard</title>
        <meta name="description" content="An elem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={inter.className}>
        <AddNewPlayerModal/>
        <StopPlayerModal/>
        <Container fluid className={styles.pageContainer}>
          <Row>
            <Col className={styles.pageCol}><PlayerList /></Col>
            <Col className={styles.pageCol} xs={5}>2 of 3</Col>
            <Col className={styles.pageCol}>3 of 3</Col>
          </Row>
        </Container>
      </main>
    </>
  )
}
