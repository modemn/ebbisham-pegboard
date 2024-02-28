import { canPick, pickNextGame } from '@utils/match-pick-utils'
import { useGlobalStore } from '@utils/store'
import React from 'react'
import { Button, Card, CardBody, ListGroup, ListGroupItem } from 'react-bootstrap'

const NextOn: React.FC = () => {
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification])

	const handlePickNext = () => {
        const {pickable, reason} = canPick();
        if (pickable) {
            console.log('Picking Next Match')
            const players = pickNextGame()
            console.log(players)
        } else {
            setToastNotification(true, reason, 'Error', 'danger')
        }
	}

    return (
        <div>
            <h3 className='mb-3'>Next On</h3>
            <Button className='w-100 mb-3' onClick={handlePickNext}>Pick Next Match<i className="bi bi-arrow-right-square mx-2" /></Button>
            <Card>
                <CardBody>
                    <ListGroup className='text-center'>
                        <ListGroupItem>????????</ListGroupItem>
                        <ListGroupItem>????????</ListGroupItem>
                    </ListGroup>
                    <h4 className='my-3 text-center'>VS</h4>
                    <ListGroup className='text-center'>
                        <ListGroupItem>????????</ListGroupItem>
                        <ListGroupItem>????????</ListGroupItem>
                    </ListGroup>
                </CardBody>
            </Card>
        </div>
    )
}

export default NextOn