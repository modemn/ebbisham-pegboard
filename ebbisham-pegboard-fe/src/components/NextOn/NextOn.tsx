import React from 'react'
import { Card, CardBody, ListGroup, ListGroupItem } from 'react-bootstrap'

const NextOn: React.FC = () => {
  return (
    <div>
        <h3 className='mb-3'>Next On</h3>
        <Card>
            <CardBody>
                <ListGroup>
                    <ListGroupItem>Firstname Lastname</ListGroupItem>
                    <ListGroupItem>Firstname Lastname</ListGroupItem>
                </ListGroup>
                <h4 className='my-3 text-center'>VS</h4>
                <ListGroup>
                    <ListGroupItem>Firstname Lastname</ListGroupItem>
                    <ListGroupItem>Firstname Lastname</ListGroupItem>
                </ListGroup>
            </CardBody>
        </Card>
    </div>
  )
}

export default NextOn