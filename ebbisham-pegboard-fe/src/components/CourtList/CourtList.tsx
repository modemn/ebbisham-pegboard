import React from 'react'
import { Button } from 'react-bootstrap'

const CourtList: React.FC = () => {
  return (
    <div className="d-grid gap-2">
        <h3>Courts</h3>
        <Button>Add Court<i className="bi bi-plus-square mx-2" /></Button>
    </div>
  )
}

export default CourtList