import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";
import "../flow/config.js";

export default function Home() {
  const [user, setUser] = useState({ loggedIn: false });
  const [balance, setBalance] = useState('0.0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // This keeps track of the logged in 
  // user for you automatically.
  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
  }, [])

  async function getBalance() {

    const result = await fcl.send([
      fcl.script`
      import FungibleToken from 0xDeployer
      import ExampleToken from 0xDeployer

      pub fun main(account: Address): UFix64 {
          let vaultRef = getAccount(account).getCapability(/public/ExampleTokenBalance)
                          .borrow<&ExampleToken.Vault{FungibleToken.Balance}>()
                          ?? panic("Could not borrow Balance reference to the Vault")

          return vaultRef.balance
      }
      `,
      fcl.args([
        fcl.arg(user?.addr, t.Address)
      ])
    ]).then(fcl.decode);

    console.log(result)
    setBalance(result);
  }

  async function transferTokens(amount, recipient) {

    const transactionId = await fcl.send([
      fcl.transaction`
      import FungibleToken from 0xDeployer
      import ExampleToken from 0xDeployer

      transaction(amount: UFix64, recipient: Address) {
        let SentVault: @FungibleToken.Vault
        prepare(signer: AuthAccount) {
            let vaultRef = signer.borrow<&ExampleToken.Vault>(from: /storage/ExampleTokenVault)
                              ?? panic("Could not borrow reference to the owner's Vault!")

            self.SentVault <- vaultRef.withdraw(amount: amount)
        }

        execute {
            let receiverRef = getAccount(recipient).getCapability(/public/ExampleTokenReceiver)
                                .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
                                ?? panic("Could not borrow receiver reference to the recipient's Vault")

            receiverRef.deposit(from: <-self.SentVault)
        }
      }
      `,
      fcl.args([
        fcl.arg(parseFloat(amount).toFixed(2), t.UFix64),
        fcl.arg(recipient, t.Address)
      ]),
      fcl.proposer(fcl.authz),
      fcl.payer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.limit(999)
    ]).then(fcl.decode);

    console.log({transactionId});
  }

  async function setupVault() {

    const transactionId = await fcl.send([
      fcl.transaction`
      import FungibleToken from 0xDeployer
      import ExampleToken from 0xDeployer

      transaction() {

        prepare(signer: AuthAccount) {
          if signer.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault) == nil {
            signer.save(
                <-ExampleToken.createEmptyVault(),
                to: /storage/ExampleTokenVault
            )

            signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                /public/ExampleTokenReceiver,
                target: /storage/ExampleTokenVault
            )

            signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                /public/ExampleTokenBalance,
                target: /storage/ExampleTokenVault
            )
          }
        }
    }
      `,
      fcl.args([]),
      fcl.proposer(fcl.authz),
      fcl.payer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.limit(999)
    ]).then(fcl.decode);

    console.log({transactionId});
  }

  return (
    <div>
      <Head>
        <title>2-FUNGIBLE-TOKEN</title>
        <meta name="description" content="Used by Emerald Academy" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1>User Address: {user.loggedIn ? user.addr : null}</h1>
      <button onClick={fcl.authenticate}>Log In</button>
      <button onClick={fcl.unauthenticate}>Log Out</button>
      <button onClick={setupVault}>Setup Vault</button>
      <button onClick={getBalance}>Get Balance</button>
      <input type="text" placeholder="recipient address" onChange={e => setRecipient(e.target.value)} />
      <input type="text" placeholder="amount" onChange={e => setAmount(e.target.value)} />
      <button onClick={() => transferTokens(amount, recipient)}>Transfer Tokens</button>
      <h2>Balance: {balance}</h2>
    </div>
  )
}
