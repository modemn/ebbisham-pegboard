import React, { useEffect, useState } from 'react'
import { collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import Spinner from 'react-bootstrap/Spinner';
import { db } from '@ebb-firebase/clientApp';
import { Button, ListGroup, ListGroupItem, OverlayTrigger, Tooltip } from 'react-bootstrap';
import "react-widgets/styles.css";
import Combobox from "react-widgets/Combobox";

import styles from './player-list.module.css';
import { TPlayer } from '@utils/types';
import { useGlobalStore } from '@utils/store';

const PlayerList: React.FC = () => {
  const [players] = useGlobalStore((state) => [state.players])
  const [playersInQueue] = useGlobalStore((state) => [state.playersInQueue])
  const [pausedPlayers] = useGlobalStore((state) => [state.pausedPlayers])
  const [setPlayers] = useGlobalStore((state) => [state.setPlayers])
  const [setPlayersInQueue] = useGlobalStore((state) => [state.setPlayersInQueue])
  const [setPausedPlayers] = useGlobalStore((state) => [state.setPausedPlayers])
  const [addPlayerToQueue] = useGlobalStore((state) => [state.addPlayerToQueue])
  const [togglePausePlayer] = useGlobalStore((state) => [state.togglePausePlayer])
  const [setIsStopPlayerModalOpen] = useGlobalStore((state) => [state.setIsStopPlayerModalOpen])
  const [setIsAddNewPlayerModalOpen] = useGlobalStore((state) => [state.setIsAddNewPlayerModalOpen])

  const [comboBoxInput, setComboBoxInput] = useState('')

  const [users, usersLoading, usersError] = useCollection(
		collection(db, 'users'),
		{}
	)

  const isPlayerPaused = (playerId: string) => {
    return pausedPlayers.has(playerId)
  };

  useEffect(() => {
    if (!usersLoading && !usersError && users) {
      const allPlayersFromDB = users.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPlayer))
      const stoppedPlayersFromDB = allPlayersFromDB.filter((player) => {
        return player.playStatus === 'stopped';
      });
      setPlayers(stoppedPlayersFromDB)
      const playersInQueueFromDB = allPlayersFromDB.filter((player) => {
        return player.playStatus === 'playing' || player.playStatus === 'paused';
      });
      setPlayersInQueue(playersInQueueFromDB)
      const pausedPlayerFromDB = allPlayersFromDB.filter((player) => {
        return player.playStatus === 'paused';
      });
      setPausedPlayers(pausedPlayerFromDB)
    }
  }, [usersLoading, usersError, users, setPlayers, setPlayersInQueue, setPausedPlayers])

  return (
    <div>
			{usersError && <strong>Error: {JSON.stringify(usersError)}</strong>}
			{usersLoading && 
				<Spinner animation="border" role="status">
					<span className="visually-hidden">Loading...</span>
				</Spinner>
			}
      <div className={styles.inputRow}>
			{users &&
        <Combobox
          hideEmptyPopup
          data={Array.from(players.values())}
          dataKey='id'
          textField='name'
          renderListItem={({ item }) => (
            <span>{item.name}</span>
          )}
          placeholder="Add Player to Queue"
          onChange={(value) => {setComboBoxInput(value as string)}}
          onSelect={(player) => addPlayerToQueue(player as TPlayer)}
          value={comboBoxInput}
          onBlur={() => {setComboBoxInput('')}}
          busy={usersLoading}
        />  
			}
      <Button onClick={() => setIsAddNewPlayerModalOpen(true)}>
        <i className="bi bi-person-fill-add" />
      </Button>
      </div>
      {Array.from(playersInQueue.values()).length > 0 &&
        <ListGroup className={styles.playerQueue}>
          {Array.from(playersInQueue.values()).map((player: TPlayer) => {
            return (
              <ListGroupItem key={player.id} className={styles.playerQueueItem}>
                <p className={`${styles.playerQueueItemName} ${isPlayerPaused(player.id) ? styles.playerQueueItemNamePaused : ''}`}>{player.name}</p>
                <div>
                  <OverlayTrigger overlay={<Tooltip id='stop-tooltip'>Stop Playing</Tooltip>}>
                    <Button 
                      className={styles.playerQueueItemButton} 
                      variant='primary' 
                      size='sm' 
                      onClick={() => {console.log(player); setIsStopPlayerModalOpen(player)}}
                      disabled={isPlayerPaused(player.id)}
                    >
                      <i className="bi bi-slash-square"/>
                    </Button>
                  </OverlayTrigger>
                  <OverlayTrigger overlay={<Tooltip id='pause-tooltip'>{isPlayerPaused(player.id) ? 'Resume' : 'Pause Playing'}</Tooltip>}>
                    <Button 
                      className={styles.playerQueueItemButton} 
                      variant='secondary' 
                      size='sm' 
                      onClick={() => togglePausePlayer(player)}
                    >
                      {isPlayerPaused(player.id) ? <i className="bi bi-play"/> : <i className="bi bi-pause"/>}
                    </Button>
                  </OverlayTrigger>
                </div>
              </ListGroupItem>
            )
          })}
        </ListGroup>
      }
		</div>
  )
}

export default PlayerList