import React, { useEffect, useState } from 'react'
import { useGlobalStore } from '@utils/store';
import { Button, Col, Form, FormControl, FormGroup, FormLabel, FormSelect, InputGroup, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Row } from 'react-bootstrap';
import { createPortal } from 'react-dom';
import * as formik from 'formik';
import * as yup from 'yup';
import { addNewPlayer } from '@utils/firestore_utils';
import { TPlayer } from '@utils/types';

const AddNewPlayerModal: React.FC = () => {
  const [isAddNewPlayerModalOpen] = useGlobalStore((state) => [state.isAddNewPlayerModalOpen]);
  const [setIsAddNewPlayerModalOpen] = useGlobalStore((state) => [state.setIsAddNewPlayerModalOpen]);
  const [addNewPlayerToStore] = useGlobalStore((state) => [state.addNewPlayerToStore]);

  const [isLoading, setIsLoading] = useState(false);

  const { Formik } = formik;
  const schema = yup.object().shape({
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    gender: yup.string().required('Gender is required').oneOf(['M', 'F'], 'Playing Gender should be one of M or F'),
  });

  const [mounted, setMounted] = useState(false)

  const handleClose = () => {
    setIsAddNewPlayerModalOpen(false)
  }

  const handleAdd = async (values: any) => {
    console.log(values)
    setIsLoading(true)
    const newPlayerToAdd: TPlayer = {
      id: 'tempid',
      name: values.firstName+' '+values.lastName,
      gender: values.gender,
      playStatus: 'stopped' 
    }
    const id = await addNewPlayer(newPlayerToAdd)
    addNewPlayerToStore({ ...newPlayerToAdd, id: id });
    setIsLoading(false)
    setIsAddNewPlayerModalOpen(false)
  }


  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
    {mounted && !!isAddNewPlayerModalOpen && createPortal(
      <Modal show={!!isAddNewPlayerModalOpen} onHide={handleClose} centered>
        <ModalHeader closeButton>
          <ModalTitle>Add New Player</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Formik
            validationSchema={schema}
            onSubmit={handleAdd}
            initialValues={{
              firstName: '',
              lastName: '',
              gender: '',
            }}
          >
            {({ handleSubmit, handleChange, values, touched, errors }) => (
              <Form noValidate onSubmit={handleSubmit} id='addNewPlayerForm'>
                <Form.Group className='mb-3' controlId="validationFormik01">
                  <Form.Label>First name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    isValid={touched.firstName && !errors.firstName}
                    isInvalid={touched.firstName && !!errors.lastName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className='mb-3' controlId="validationFormik02">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    isValid={touched.lastName && !errors.lastName}
                    isInvalid={touched.lastName && !!errors.lastName}
                  />
                  <FormControl.Feedback type="invalid">
                    {errors.lastName}
                  </FormControl.Feedback>
                </Form.Group>
                <Form.Group className='mb-3' controlId="validationFormik03">
                  <Form.Label>Playing Gender</Form.Label>
                  <Form.Control
                    as='select'
                    name="gender"
                    value={values.gender}
                    onChange={handleChange}
                    isValid={touched.gender && !errors.gender}
                    isInvalid={touched.gender && !!errors.gender}
                  >
                    <option value=''>Select Gender</option>
                    <option value='M'>Male</option>
                    <option value='F'>Female</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.gender}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form>
            )}
          </Formik>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type='submit' form='addNewPlayerForm' disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Player'}
          </Button>
        </ModalFooter>
      </Modal>, 
      document.body
    )}
    </>
  )
}

export default AddNewPlayerModal