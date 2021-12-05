import React, { Component } from "react";
import { stopReportingRuntimeErrors } from "react-error-overlay";
import 'bootstrap/dist/css/bootstrap.min.css';
import getWeb3 from "./getWeb3";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Jsonify from 'jsonify';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import OBdefiStaking from "./contracts/OBdefiStaking.json";
import "./App.css";

if (process.env.NODE_ENV === 'development') {
  stopReportingRuntimeErrors();
}

class App extends Component {

  state = { web3: null, accounts: null, contract: null };
  
  componentDidMount = async () => {
    const titreAppli = "DeFi - Staking";
    try {
      // IMPORTANT: debugMode à passer à true/false pour visualisation dans la console !
      const debugMode = true;
      
      // Récupérer le provider web3
      const web3 = await getWeb3();
  
      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas) 
      const accounts = await web3.eth.getAccounts();

      // Récupérer l’instance du smart contract "OBdefiStaking" avec web3 et les informations du déploiement du fichier (client/src/contracts/OBdefiStaking.json)
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = OBdefiStaking.networks[networkId];
  
      const instance = new web3.eth.Contract(
        OBdefiStaking.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state ==>
      // interact with the contract's methods.
      this.setState({ accounts, contract: instance, debugMode, titreAppli, web3 }, this.runInit);
    } catch (error) {
      // Catch errors : 
      this.alertAndLog('Non-Ethereum browser detected. Please connect to MetaMask before starting.', error);
    }
  };
  
  runInit = async() => {
    try {
        const { contract } = this.state;
        
        this.logify('runInit - before stakingRate');

        // Get contract information
        const stakingRate = await contract.methods.GetStakingRate().call();

        const stakingPeriodicity = await contract.methods.GetStakingPeriodicity().call();

        let contractInformation = {
          stakingRate: stakingRate,
          stakingPeriodicity: stakingPeriodicity
        };
        
        this.setState({ contractInformation });
        this.setAccountInformation();
        
        ////////////////////////////////////
        // Events logging                 //
        ////////////////////////////////////
        window.ethereum.on('accountsChanged', (accounts) => this.handleAccountsChanged(accounts));
    } catch (error) {
      // this.alertAndLog('Error in runInit', error);
      alert('Error in runInit');
    }
  }
  
  // définition des informations du compte connecté
  setAccountInformation = async() => {
    const { accounts, contract, contractInformation } = this.state;
    const connectedAccount = accounts[0];

    const stakedTokens = await contract.methods.GetStakedTokens().call(); 
    
    this.logify('setAccountInformation - stakedTokens', stakedTokens);
    
    const allTokensRewardsInETH = await contract.methods.getAllTokensRewardsInETH().call();

    this.logify('setAccountInformation - allTokensRewardsInETH', allTokensRewardsInETH);
    
    let accountInformation = {
      account: connectedAccount,
      stakedTokens: stakedTokens,
      allTokensRewardsInETH: allTokensRewardsInETH
    };
    this.setState({ accountInformation });
    this.setPageInformation(); // refresh page information
  };
  
  // définition des éléments de la page en fonction du statut
  setPageInformation = async() => {
    const { accountInformation, contractInformation } = this.state;

    let pageInformation = {
      title: '',
      explanation: ''
    };    
    this.setState({ pageInformation });
  }
  
  // fonctions communes pour message utilisateur et debug via console
  alertAndLog = async(message, objectToLog) => {
    const { titreAppli } = this.state;
    alert(message, titreAppli);
    this.logify(message, objectToLog);
  }
  
  // fonction pour logger en cas de debug
  // ATTENTION: penser  mettre debugMode = true; dans le state en début de programme !
  logify = async (message, objectToLog) => {
    const { debugMode } = this.state;
    if (debugMode) {
      if (objectToLog) {
        console.log(message + '\nInformations complémentaires : ' + Jsonify.stringify(objectToLog));
      }
      else {
        console.log(message);
      }
    }
  }
  
  //////////////////////////////
  // fonction Set du contrat  //
  //////////////////////////////

  stake = async() => {
    const { accounts, contract } = this.state;
    const tokenAddress = this.tokenAddress && this.tokenAddress.value;
    const tokenAmount = this.tokenAmount.value;
    
    await contract.methods.stakeToken(tokenAddress, tokenAmount).send({from: accounts[0]}).then(response => {
      this.logify('Stake Token (address: ' + tokenAddress + ' - amount: ' + tokenAmount + ')', response);
      this.tokenAddress.value = "";
      this.tokenAmount.value = "";
      this.setAccountInformation();
    }).catch(error => {
      this.alertAndLog('An error occurred during staking.', error);
    });
  }
 
  unstake = async() => {
    const { accounts, contract } = this.state;
    const tokenAddress = this.tokenAddress && this.tokenAddress.value;
    const tokenAmount = this.tokenAmount.value;
    
    await contract.methods.withdrawToken(tokenAddress, tokenAmount).send({from: accounts[0]}).then(response => {
      this.logify('Unstake Token (address: ' + tokenAddress + ' - amount: ' + tokenAmount + ')', response);
      this.tokenAddress.value = "";
      this.tokenAmount.value = "";
      this.setAccountInformation();
    }).catch(error => {
      this.alertAndLog('An error occurred during unstaking.', error);
    });
  }
 
  //////////////////////////////
  //         RENDERING PAGE   //
  //////////////////////////////

  render() {
    const { accounts, accountInformation, contractInformation, pageInformation } = this.state;

    return (
      <div className="App">
        <Card style={{ width: '50rem' }}>
          <Card.Header>
            <strong>Liste de vos tokens et montant stakés</strong>
            <div>Staking Rate: {contractInformation && contractInformation.stakingRate}</div>
            <div>Theoritical reward: {accountInformation && accountInformation.allTokensRewardsInETH}</div>
          </Card.Header>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Adresse</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {accountInformation && typeof(accountInformation.stakedTokens) !== 'undefined' && accountInformation.stakedTokens !== null && 
                    accountInformation.stakedTokens.map((stakeRecord, index) =>
                      <tr key={index}>
                        <td>{stakeRecord.tokenAddress}</td>
                        <td>{stakeRecord.stakedAmount}</td>
                      </tr>)
                  }
                </tbody>
              </Table>
            </ListGroup.Item>
          </ListGroup>
          <div>
            <Form.Group>
              <Form.Label>Token Address:</Form.Label> 
              <Form.Control type="text" id="tokenAddress"
              ref={(input) => { this.tokenAddress = input }}
              />
              <Form.Label>Token Amount:</Form.Label><Form.Control type="text" id="tokenAmount"
              ref={(input) => { this.tokenAmount = input }}
              />
            </Form.Group>
            <Button onClick={ this.stake } variant="dark" >Stake</Button>
            &nbsp;
            <Button onClick={ this.unstake } variant="dark" >Unstake</Button>
          </div>
        </Card>
      </div>
    );
  }
}

export default App;
