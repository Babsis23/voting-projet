import React, {useState, useEffect} from "react";
import axios from "axios";
import {ethers} from "ethers";
import {contractAbi, contractAddress} from "./Constant/constant";
import Login from "./Components/Login";
import Finished from "./Components/Finished";
import Connected from "./Components/Connected";
import "./App.css";

const pinataApiKey = "ecd5e7af87f6731bf1eb";
const pinataSecretApiKey = "9c43ab9dc2f65f0e462a9c4383060e412043a0b4433888d142c38aca638afe20";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setRemainingTime] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [number, setNumber] = useState("");
  const [isAllowedToVote, setIsAllowedToVote] = useState(true);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateImage, setNewCandidateImage] = useState(null);

  useEffect(() => {
    getCandidates();
    getRemainingTime();
    getCurrentStatus();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  async function vote() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );

    const tx = await contractInstance.vote(number);
    await tx.wait();
    checkIfCanVote();
  }

  async function addCandidate() {
    if (!newCandidateName || !newCandidateImage) {
      return alert("Veuillez entrer le nom du candidat et sélectionnez une image");
    }

    try {
      const formData = new FormData();
      formData.append("file", newCandidateImage);

      const metadata = JSON.stringify({
        name: newCandidateImage.name,
        keyvalues: {
          description: "Image de candidat téléchargée avec Pinata",
        },
      });

      formData.append("pinataMetadata", metadata);
      formData.append("pinataOptions", JSON.stringify({cidVersion: 1}));

      const result = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        }
      );

      const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );

      const tx = await contractInstance.addCandidate(newCandidateName, imageUrl);
      await tx.wait();
      getCandidates();
    } catch (error) {
      console.error("Erreur au cours de l'ajout:", error);
      alert("Erreur lors de l'ajout du candidat");
    }
  }

  async function resetVotes() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );

    const tx = await contractInstance.resetVotes();
    await tx.wait();
    getCandidates(); // Refresh the candidate list after resetting votes
  }

  async function checkIfCanVote() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const voteStatus = await contractInstance.voters(await signer.getAddress());
    setIsAllowedToVote(voteStatus);
  }

  async function getCandidates() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const candidatesList = await contractInstance.getAllVotesOfCandidates();
    const formattedCandidates = candidatesList.map((candidate, index) => {
      return {
        index: index,
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber(),
        image: candidate.image,
      };
    });
    setCandidates(formattedCandidates);
  }

  async function getCurrentStatus() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const status = await contractInstance.getVotingStatus();
    setVotingStatus(status);
  }

  async function getRemainingTime() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );
    const time = await contractInstance.getRemainingTime();
    setRemainingTime(parseInt(time, 16));
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0 && account !== accounts[0]) {
      setAccount(accounts[0]);
      checkIfCanVote();
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }

  async function connectToMetamask() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);
        checkIfCanVote();
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("Metamask n'est pas détecté sur le navigateur");
    }
  }

  function handleNumberChange(e) {
    setNumber(e.target.value);
  }

  function handleNewCandidateChange(e) {
    setNewCandidateName(e.target.value);
  }

  function handleNewCandidateImageChange(e) {
    setNewCandidateImage(e.target.files[0]);
  }

  return (
    <div className="app">
      {votingStatus ? (
        isConnected ? (
          <div>
            <Connected
              account={account}
              candidates={candidates}
              remainingTime={remainingTime}
              number={number}
              handleNumberChange={handleNumberChange}
              voteFunction={vote}
              showButton={isAllowedToVote}
              resetVotes={resetVotes} // Pass the resetVotes function
            />
            <AddCandidate
              addCandidate={addCandidate}
              newCandidateName={newCandidateName}
              handleNewCandidateChange={handleNewCandidateChange}
              handleNewCandidateImageChange={handleNewCandidateImageChange}
            />
          </div>
        ) : (
          <Login connectWallet={connectToMetamask} />
        )
      ) : (
        <Finished />
      )}
    </div>
  );
}

function AddCandidate({
  addCandidate,
  newCandidateName,
  handleNewCandidateChange,
  handleNewCandidateImageChange,
}) {
  return (
    <div className="form">
      <input
        type="text"
        value={newCandidateName}
        onChange={handleNewCandidateChange}
        placeholder="Nom du candidat"
      />
      <input type="file" onChange={handleNewCandidateImageChange} />
      <button onClick={addCandidate}>Ajouter candidat</button>
    </div>
  );
}

export default App;
