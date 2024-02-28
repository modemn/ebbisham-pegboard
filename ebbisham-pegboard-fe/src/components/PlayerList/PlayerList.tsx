import React, { useEffect, useState } from 'react'
import { collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@ebb-firebase/clientApp';
import { Button, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import "react-widgets/styles.css";
import Combobox from "react-widgets/Combobox";

import styles from './player-list.module.css';
import { TPlayer } from '@utils/types';
import { useGlobalStore } from '@utils/store';
import PlayerListItem from './PlayerListItem/PlayerListItem';

const PlayerList: React.FC = () => {
  const [players] = useGlobalStore((state) => [state.players])
  const [playersInQueue] = useGlobalStore((state) => [state.playersInQueue])
  const [pausedPlayers] = useGlobalStore((state) => [state.pausedPlayers])
  const [setPlayers] = useGlobalStore((state) => [state.setPlayers])
  const [setPlayersInQueue] = useGlobalStore((state) => [state.setPlayersInQueue])
  const [setPausedPlayers] = useGlobalStore((state) => [state.setPausedPlayers])
  const [addPlayerToQueue] = useGlobalStore((state) => [state.addPlayerToQueue])
  const [setIsAddNewPlayerModalOpen] = useGlobalStore((state) => [state.setIsAddNewPlayerModalOpen])

  const [comboBoxInput, setComboBoxInput] = useState('')

  const [users, usersLoading, usersError] = useCollection(
		collection(db, 'users'),
		{}
	)

  useEffect(() => {
    if (!usersLoading && !usersError && users) {
      const allPlayersFromDB = users.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPlayer))
      const stoppedPlayersFromDB = allPlayersFromDB.filter((player) => {
        return player.playStatus === '-1';
      });
      setPlayers(stoppedPlayersFromDB)
      const playersInQueueFromDB = allPlayersFromDB.filter((player) => {
        return Number(player.playStatus) > 0;
      });
      setPlayersInQueue(playersInQueueFromDB)
      const pausedPlayerFromDB = allPlayersFromDB.filter((player) => {
        return player.playStatus === '0';
      });
      setPausedPlayers(pausedPlayerFromDB)
    }
  }, [usersLoading, usersError, users, setPlayers, setPlayersInQueue, setPausedPlayers])

  return (
    <div>
      <h3 className='mx-2 mb-3'>Players Queue</h3>
			{usersError && <strong>Error: {JSON.stringify(usersError)}</strong>}
      <div className={styles.inputRow}>
        <Combobox
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
          className={styles.combobox}
        />
      <OverlayTrigger overlay={<Tooltip id='pause-tooltip'>Add New Player</Tooltip>}>
        <Button className={styles.addPlayerButton} onClick={() => setIsAddNewPlayerModalOpen(true)}>
          <i className="bi bi-person-fill-add" />
        </Button>
      </OverlayTrigger>
      </div>
      
      {Array.from(playersInQueue.values()).length === 0 && Array.from(pausedPlayers.values()).length === 0 && <p className={styles.noPlayers}>No players in queue.</p>}
      {Array.from(playersInQueue.values()).length > 0 &&
        <>
          <h4 className={styles.playersTitle}>Playing</h4>
          <ListGroup className={styles.playerQueue}>
            {Array.from(playersInQueue.values()).map((player: TPlayer, index: number) => {
              return (
                <PlayerListItem key={player.id} player={player} isChair={index === 0}/>
              )
            })}
          </ListGroup>
        </>
      }
      {Array.from(pausedPlayers.values()).length > 0 && <h4 className={styles.playersTitle}>Paused</h4>}
      {Array.from(pausedPlayers.values()).length > 0 &&
        <ListGroup className={styles.playerQueue}>
          {Array.from(pausedPlayers.values()).map((player: TPlayer) => {
            return (
              <PlayerListItem key={player.id} player={player} />
            )
          })}
        </ListGroup>
      }
		</div>
  )
};

export default PlayerList;