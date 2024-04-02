import { canPick, pickNextGame } from '@utils/match-pick-utils'
import { useGlobalStore } from '@utils/store'
import { TPlayer } from '@utils/types'
import React, { useRef, useState } from 'react'
import { Button, Card, CardBody, ListGroup, ListGroupItem, Spinner, Placeholder} from 'react-bootstrap'
import styles from './next-on.module.css'

const NextOn: React.FC = () => {
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification])
    const [loading, setLoading] = useState(false)
    // TODO: move this state to the store
    // TODO: get the state from the db and render appropriately
    const [nextOnPlayers, setNextOnPlayers] = useState<TPlayer[]>([])
    const autoPickRef = useRef<HTMLInputElement|null>(null)

	const handlePickNext = () => {
        const {pickable, reason} = canPick();
        if (pickable) {
            setLoading(true)
            const players = pickNextGame()
            console.log(players)
            setNextOnPlayers(players)
            // TODO: persist this in the db
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        } else {
            setToastNotification(true, reason, 'Error', 'danger')
        }
	}

    return (
        <div>
            <h3 className='mb-3'>Next On</h3>
            <Button className='w-100 mb-3' onClick={handlePickNext}>Pick Next Match<i className="bi bi-arrow-right-square mx-2" /></Button>
            {/* TODO: add in a checkbox for autopicking the next match so user doesn't have to keep clicking the button */}
            {/* Initial state - user hasn't clicked the button yet */}
            {nextOnPlayers.length === 0 && !loading && <Card>
                <CardBody>
                    <ListGroup className='text-center'>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                    </ListGroup>
                    <h4 className='my-3 text-center'>VS</h4>
                    <ListGroup className='text-center'>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                    </ListGroup>
                </CardBody>
            </Card>}
            {/* Loading state - user has clicked the button */}
            {loading && <Card>
                <CardBody>
                    <ListGroup className='text-center'>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                    </ListGroup>
                    <h4 className='my-3 text-center'><Spinner/></h4>
                    <ListGroup className='text-center'>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                        <ListGroupItem><Placeholder xs={6} /></ListGroupItem>
                    </ListGroup>
                </CardBody>
            </Card>}
            {/* Final state - user has clicked the button and the game has been picked */}
            {!loading && nextOnPlayers.length > 0 && <Card>
                <CardBody>
                    <ListGroup className='text-center'>
                        <ListGroupItem>{nextOnPlayers[0].name}</ListGroupItem>
                        <ListGroupItem>{nextOnPlayers[1].name}</ListGroupItem>
                    </ListGroup>
                    <h4 className={styles.vs}>VS</h4>
                    <ListGroup className='text-center'>
                        <ListGroupItem>{nextOnPlayers[2].name}</ListGroupItem>
                        <ListGroupItem>{nextOnPlayers[3].name}</ListGroupItem>
                    </ListGroup>
                </CardBody>
            </Card>}
        </div>
    )
}

export default NextOn