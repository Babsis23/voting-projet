import React from "react";
import "./Connected.css";

const Connected = (props) => {
  // Sort candidates by vote count in descending order
  const sortedCandidates = props.candidates.sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="connected-container">
      <h1 className="connected-header">Vous êtes connecté à Metamask</h1>
      <p className="connected-account">Compte Metamask: {props.account}</p>
      
      {props.showButton ? (
        <p className="connected-account">Vous avez déjà voté</p>
      ) : (
        <div className="input-container">
          <input
            type="number"
            placeholder="Index de candidat"
            value={props.number}
            onChange={props.handleNumberChange}
            className="input"
          />
          <button className="login-button" onClick={props.voteFunction}>
            Vote
          </button>
        </div>
      )}
      

      <table id="myTable" className="candidates-table">
        <thead>
          <tr>
            <th>Index</th>
            <th>Photo de candidat</th>
            <th>Nom de candidat</th>
            <th>Votes de candidat</th>
          </tr>
        </thead>
        <tbody>
          {sortedCandidates.map((candidate, index) => (
            <tr key={index}>
              <td>{index }</td>
              <td>
                <img
                  className="candidate-image"
                  alt={`Uploaded #${index + 1}`}
                  src={candidate.image}
                />
              </td>
              <td>{candidate.name}</td>
              <td>{candidate.voteCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Connected;
