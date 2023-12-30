import { useGlobalStore } from '@utils/store';
import { TPlayer } from '@utils/types';
import React, { useEffect, useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';
import { createPortal } from 'react-dom';

const StopPlayerModal: React.FC = () => {
  const [isStopPlayerModalOpen] = useGlobalStore((state) => [state.isStopPlayerModalOpen])
  const [setIsStopPlayerModalOpen] = useGlobalStore((state) => [state.setIsStopPlayerModalOpen])
  const [removePlayerFromQueue] = useGlobalStore((state) => [state.removePlayerFromQueue])

  const [mounted, setMounted] = useState(false)

  const handleClose = () => {
    setIsStopPlayerModalOpen(null)
  }

  const handleStop = () => {
    removePlayerFromQueue(isStopPlayerModalOpen as TPlayer)
    setIsStopPlayerModalOpen(null)
  }

  useEffect(() => {
    setMounted(true)
  }, [])
    
  return (
    <>
    {mounted && !!isStopPlayerModalOpen && createPortal(
      <Modal show={!!isStopPlayerModalOpen} onHide={handleClose} centered>
        <ModalHeader closeButton>
          <ModalTitle>Stop Playing</ModalTitle>
        </ModalHeader>
        <ModalBody>Are you sure you want to stop <span style={{fontWeight: 'bold'}}> {(isStopPlayerModalOpen as TPlayer).name}</span> playing?</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleStop}>
            Stop Playing
          </Button>
        </ModalFooter>
      </Modal>, 
      document.body
    )}
    </>
  )
}

export default StopPlayerModal