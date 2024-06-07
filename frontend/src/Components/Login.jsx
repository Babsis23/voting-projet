import React from "react";
import "./Login.css";

const Login = (props) => {
    return (
        <div className="login-container">
            <h1 className="welcome-message">Bienvenue à l'application de vote</h1>
            <button className="login-button" onClick = {props.connectWallet}>Login Metamask</button>
        </div>
    )
}

export default Login;