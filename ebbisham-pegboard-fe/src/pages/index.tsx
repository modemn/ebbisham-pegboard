import Head from 'next/head'
import { Inter } from 'next/font/google'
import { Col, Container, Row, Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap'

const inter = Inter({ subsets: ['latin'] })

import styles from '@/styles/Home.module.css'
import PlayerList from '@/components/PlayerList/PlayerList'
import StopPlayerModal from '@/components/StopPlayerModal/StopPlayerModal'
import AddNewPlayerModal from '@/components/AddNewPlayerModal/AddNewPlayerModal'
import CourtList from '@/components/CourtList/CourtList'
import NextOn from '@/components/NextOn/NextOn'
import { useGlobalStore } from '@utils/store'

export default function Home() {
  const [toastNotification] = useGlobalStore((state) => [state.toastNotification])
  const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification])
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
        <ToastContainer
          className="p-3"
          position={'top-end'}
          style={{ zIndex: 1 }}
        >
          <Toast bg={toastNotification.variant} onClose={() => setToastNotification(false, '', '', undefined)} show={toastNotification.isOpen} delay={3000} autohide>
            <ToastHeader closeButton={false}>
              <strong className="me-auto">{toastNotification.title}</strong>
            </ToastHeader>
            <ToastBody className={toastNotification.variant === 'danger' ? 'text-white' : 'text-dark'}>{toastNotification.message}</ToastBody>
          </Toast>
        </ToastContainer>
        <Container fluid className={styles.pageContainer}>
          <Row>
            <Col className={styles.pageCol}><PlayerList /></Col>
            <Col className={styles.pageCol}><NextOn/></Col>
            <Col className={styles.pageCol} xs={5}><CourtList /></Col>
          </Row>
        </Container>
      </main>
    </>
  )
}
