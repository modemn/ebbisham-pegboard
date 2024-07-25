import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '@utils/store';
import { Button, ButtonGroup, Col, Form, FormControl, FormGroup, FormLabel, ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Row, ToggleButton } from 'react-bootstrap';
import { createPortal } from 'react-dom';
import * as formik from 'formik';
import * as yup from 'yup';
import { recordMatch } from '@utils/firestore_utils';
import { TPlayer } from '@utils/types';

const EndMatchModal: React.FC = () => {
    const [isEndMatchModalOpen] = useGlobalStore((state) => [state.isEndMatchModalOpen]);
    const [setIsEndMatchModalOpen] = useGlobalStore((state) => [state.setIsEndMatchModalOpen]);
    const [endMatchOnCourt] = useGlobalStore((state) => [state.endMatchOnCourt]);

    const [players, setPlayers] = useState<{ [key: number]: TPlayer }>();
    const [winner, setWinner] = useState<'Home' | 'Away' | null>(null);

    const { Formik } = formik;
    const schema = yup.object().shape({
        homeScore: yup.number().moreThan(-1, 'Score must be at least 0').lessThan(30, 'Score must be less than 30').required('Score is required'),
        awayScore: yup.number().moreThan(-1, 'Score must be at least 0').lessThan(30, 'Score must be less than 30').required('Score is required'),
    });

    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleEndMatch = (values: any) => {
        setIsLoading(true);
        if (isEndMatchModalOpen) {
            endMatchOnCourt(isEndMatchModalOpen, values.homeScore, values.awayScore, Date.now());
        }
        setIsLoading(false);
        handleClose();
    };

    const handleClose = () => {
        setIsEndMatchModalOpen(null);
        setWinner(null);
    };

    useEffect(() => {
        if (isEndMatchModalOpen && isEndMatchModalOpen.players[0].length > 0) {
            const allPlayers = useGlobalStore.getState().players;
            const playersOnCourt = {
                0: allPlayers.get(isEndMatchModalOpen.players[0]) as TPlayer,
                1: allPlayers.get(isEndMatchModalOpen.players[1]) as TPlayer,
                2: allPlayers.get(isEndMatchModalOpen.players[2]) as TPlayer,
                3: allPlayers.get(isEndMatchModalOpen.players[3]) as TPlayer,
            };

            setPlayers(playersOnCourt);
        }
    }, [isEndMatchModalOpen]);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {mounted &&
                !!isEndMatchModalOpen &&
                createPortal(
                    <Modal show={!!isEndMatchModalOpen} onHide={handleClose} centered>
                        <Formik
                            validationSchema={schema}
                            onSubmit={handleEndMatch}
                            initialValues={{
                                homeScore: 0,
                                awayScore: 0,
                            }}
                        >
                            {({ handleSubmit, handleChange, setFieldValue, values, touched, errors, dirty }) => (
                                <>
                                    <ModalHeader closeButton>
                                        <ModalTitle>End Match</ModalTitle>
                                    </ModalHeader>
                                    <ModalBody>
                                        <p>Select the winner of the match with the &quot;Home&quot; or &quot;Away&quot; buttons below. Optionally, enter the exact score.</p>
                                        {players && (
                                            <Row>
                                                <Col xs lg='5'>
                                                    <ListGroup className='text-center'>
                                                        <ListGroupItem>{players[0].name}</ListGroupItem>
                                                        <ListGroupItem>{players[1].name}</ListGroupItem>
                                                    </ListGroup>
                                                </Col>
                                                <Col style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VS</Col>
                                                <Col xs lg='5'>
                                                    <ListGroup className='text-center'>
                                                        <ListGroupItem>{players[2].name}</ListGroupItem>
                                                        <ListGroupItem>{players[3].name}</ListGroupItem>
                                                    </ListGroup>
                                                </Col>
                                            </Row>
                                        )}
                                        <Form noValidate onSubmit={handleSubmit} id='addNewPlayerForm'>
                                            <Row className='justify-content-md-center my-3'>
                                                <ButtonGroup>
                                                    <ToggleButton
                                                        id={'radio-home'}
                                                        type='radio'
                                                        variant={winner === 'Home' ? 'outline-success' : 'outline-secondary'}
                                                        name='radio'
                                                        value='Home'
                                                        checked={winner === 'Home'}
                                                        onChange={() => {
                                                            setFieldValue('homeScore', 21);
                                                            setFieldValue('awayScore', 0);
                                                            setWinner('Home');
                                                        }}
                                                    >
                                                        Home
                                                    </ToggleButton>
                                                    <ToggleButton
                                                        id={'radio-away'}
                                                        type='radio'
                                                        variant={winner === 'Away' ? 'outline-success' : 'outline-secondary'}
                                                        name='radio'
                                                        value='Away'
                                                        checked={winner === 'Away'}
                                                        onChange={() => {
                                                            setFieldValue('awayScore', 21);
                                                            setFieldValue('homeScore', 0);
                                                            setWinner('Away');
                                                        }}
                                                    >
                                                        Away
                                                    </ToggleButton>
                                                </ButtonGroup>
                                            </Row>
                                            <Row className='justify-content-md-center'>
                                                <Col xs lg='3'>
                                                    <FormControl type='number' min='0' max='30' name='homeScore' placeholder='Home Score' value={values.homeScore} onChange={handleChange} isValid={touched.homeScore && !errors.homeScore} isInvalid={touched.homeScore && !!errors.homeScore} />
                                                    <FormControl.Feedback type='invalid'>{errors.homeScore}</FormControl.Feedback>
                                                </Col>
                                                <Col xs lg='3'>
                                                    <FormControl type='number' min='0' max='30' name='awayScore' placeholder='Away Score' value={values.awayScore} onChange={handleChange} isValid={touched.awayScore && !errors.awayScore} isInvalid={touched.awayScore && !!errors.awayScore} />
                                                    <FormControl.Feedback type='invalid'>{errors.awayScore}</FormControl.Feedback>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button variant='secondary' onClick={handleClose}>
                                            Cancel
                                        </Button>
                                        <Button type='submit' form='addNewPlayerForm' disabled={!dirty || isLoading}>
                                            {isLoading ? 'Ending...' : 'End Match'}
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}
                        </Formik>
                    </Modal>,
                    document.body
                )}
        </>
    );
};

export default EndMatchModal;
