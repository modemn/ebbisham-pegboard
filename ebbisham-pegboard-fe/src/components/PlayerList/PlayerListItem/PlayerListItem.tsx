import React from 'react'

import styles from './player-list-item.module.css'
import { Button, ListGroupItem, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { TPlayer } from '@utils/types'
import { useGlobalStore } from '@utils/store'

type Props = {
    player: TPlayer
    isChair?: boolean
}

const PlayerListItem: React.FC<Props> = ({player, isChair}) => {
  const [pausedPlayers] = useGlobalStore((state) => [state.pausedPlayers]);
  const [setIsStopPlayerModalOpen] = useGlobalStore((state) => [state.setIsStopPlayerModalOpen]);
  const [togglePausePlayer] = useGlobalStore((state) => [state.togglePausePlayer]);

  const isPlayerPaused = (playerId: string) => {
    return pausedPlayers.has(playerId)
  };
  
  return (
    <ListGroupItem className={`${styles.playerQueueItem} ${isChair ? styles.playerQueueItemChair : ''}`}>
        <p className={`${styles.playerQueueItemName} ${isPlayerPaused(player.id) ? styles.playerQueueItemNamePaused : ''}`}>
            {player.gender==='M' && <i className="bi bi-circle mx-2"/>}
            {player.gender==='F' && <i className="bi bi-circle-fill mx-2"/>}
            {player.name}
        </p>
        
        <div>
            <OverlayTrigger overlay={<Tooltip id='stop-tooltip'>Stop Playing</Tooltip>}>
            <Button 
                className={styles.playerQueueItemButton} 
                variant='primary' 
                size='sm' 
                onClick={() => setIsStopPlayerModalOpen(player)}
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
}

export default PlayerListItem