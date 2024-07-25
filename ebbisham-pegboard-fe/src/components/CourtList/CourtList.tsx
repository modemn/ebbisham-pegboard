import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@ebb-firebase/clientApp';
import { useGlobalStore } from '@utils/store';
import Court from './Court';
import { TCourt } from '@utils/types';
import { addNewCourt, removeCourt } from '@utils/firestore_utils';

const CourtList: React.FC = () => {
    const [sessionId] = useGlobalStore((state) => [state.sessionId]);
    const [courtsFromDB, courtsFromDBLoading, courtsFromDBError] = useCollection(collection(db, 'sessions', sessionId, 'courts'), {});
    const [nextOnPlayers] = useGlobalStore((state) => [state.nextOnPlayers]);
    const [courts] = useGlobalStore((state) => [state.courts]);
    const [maxCourts] = useGlobalStore((state) => [state.gamePreferences.maxCourts]);

    const [setCourts] = useGlobalStore((state) => [state.setCourts]);
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification]);

    useEffect(() => {
        if (!courtsFromDBLoading && !courtsFromDBError && courtsFromDB) {
            const tempCourts = courtsFromDB.docs.map((doc) => {
                return {
                    id: doc.id,
                    courtNumber: doc.data().courtNumber,
                    matchStartTime: doc.data().matchStartTime,
                    players: doc.data().players,
                };
            });
            tempCourts.sort((a, b) => a.courtNumber - b.courtNumber);
            setCourts(tempCourts);
        }
    }, [courtsFromDB, courtsFromDBError, courtsFromDBLoading, setCourts]);

    const handleAddCourt = async () => {
        if (courts.length < maxCourts) {
            const newCourtToAdd: TCourt = {
                id: 'tempid',
                courtNumber: courts.length + 1,
                matchStartTime: 0,
                players: { 0: '', 1: '', 2: '', 3: '' },
            };
            await addNewCourt(newCourtToAdd);
        } else {
            setToastNotification(true, 'Cannot add more courts, maximum reached', 'Error', 'danger');
        }
    };

    const handleRemoveCourt = async () => {
        const courtToRemove = courts.at(-1) as TCourt;
        if (courtToRemove.matchStartTime === 0) {
            await removeCourt(courtToRemove.id);
        } else {
            setToastNotification(true, 'Cannot remove court while match is in progress', 'Error', 'danger');
        }
    };

    if (courtsFromDBLoading) {
        return <div>Loading...</div>;
    }

    if (courtsFromDBError) {
        return <div>Error: {courtsFromDBError.message}</div>;
    }

    return (
        <div className='d-grid gap-2'>
            <h3>Courts</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <Button style={{ width: '49%' }} onClick={handleAddCourt} disabled={courts.length >= maxCourts}>
                    Add Court
                </Button>
                <Button style={{ width: '49%' }} variant='danger' onClick={handleRemoveCourt}>
                    Remove Court
                </Button>
            </div>
            {courts.length === 0 && <p>No courts added yet.</p>}
            {courts.length > 0 && (
                <div>
                    {courts.map((court) => (
                        <Court key={court.id} court={court} canStartMatch={nextOnPlayers.size === 4} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourtList;
