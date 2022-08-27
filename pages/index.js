import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import * as fcl from "@onflow/fcl";
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

    const result = await fcl.query({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      pub fun main(account: Address): UFix64 {
          let vaultRef = getAccount(account).getCapability(ExampleToken.VaultBalancePath)
                          .borrow<&ExampleToken.Vault{FungibleToken.Balance}>()
                          ?? panic("Could not borrow Balance reference to the Vault")

          return vaultRef.balance
      }
      `,
      args: (arg, t) => [
        arg(user?.addr, t.Address)
      ]
    });

    setBalance(result);
  }

  async function transferTokens(amount, recipient) {

    const transactionId = await fcl.mutate({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      transaction(amount: UFix64, recipient: Address) {
        let SentVault: @FungibleToken.Vault
        prepare(signer: AuthAccount) {
            let vaultRef = signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath)
                              ?? panic("Could not borrow reference to the owner's Vault!")

            self.SentVault <- vaultRef.withdraw(amount: amount)
        }

        execute {
            let receiverRef = getAccount(recipient).getCapability(ExampleToken.VaultReceiverPath)
                                .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
                                ?? panic("Could not borrow receiver reference to the recipient's Vault")

            receiverRef.deposit(from: <-self.SentVault)
        }
      }
      `,
      args: (arg, t) => [
        arg(parseFloat(amount).toFixed(2), t.UFix64),
        arg(recipient, t.Address)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999
    });

    console.log('Transaction Id', transactionId);
  }

  async function setupVault() {

    const transactionId = await fcl.mutate({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      transaction() {

        prepare(signer: AuthAccount) {
          if signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath) == nil {
            signer.save(
                <-ExampleToken.createEmptyVault(),
                to: /storage/ExampleTokenVault
            )

            signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                ExampleToken.VaultReceiverPath,
                target: ExampleToken.VaultStoragePath
            )

            signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                ExampleToken.VaultBalancePath,
                target: ExampleToken.VaultStoragePath
            )
          }
        }
    }
      `,
      args: (arg, t) => [],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999
    });

    console.log('Transaction Id', transactionId);
  }

  return (
    <div className='bg-[#011E30] flex flex-col min-h-screen'>
      <Head>
        <title>2-FUNGIBLE-TOKEN</title>
        <meta name="description" content="Used by Emerald Academy" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className='container mx-auto flex-1 p-5'>
        <div className='mb-5 flex justify-between items-center pr-10 pt-2'>
          <h1 className={styles.sooth}>FUNGIBLE-TOKEN</h1>
          <div className='flex space-x-4 items-center'>
            <h1 className='text-[#38E8C6]'>Address: </h1>
            <h1 className='border px-7 text-center text-[#38E8C6] text-sm py-1 rounded-xl border-[#38E8C6] w-56'>{user.loggedIn ? user.addr : "Please connect wallet -->"}</h1>
          </div>
          <div>{!user.loggedIn ? <button className='border rounded-xl border-[#38E8C6] px-5 text-sm text-[#38E8C6] py-1'
            onClick={fcl.authenticate}>connect</button> : <button className='border rounded-xl border-[#38E8C6]
          px-5 text-sm text-[#38E8C6] py-1' onClick={fcl.unauthenticate}>Logout</button>}
          </div>
        </div>
        <hr className='border-[#38E8C6]' />
        {!user.loggedIn ? '' : <div className='flex pt-5 px-20 justify-between'>
          <button onClick={setupVault} className='rounded-lg px-9 py-2 text-blue-900 font-bold text-sm bg-[#38E8C6]'>Setup Vault</button>
          <div className='flex items-center '>
            <button className='text-[#38E8C6] text-lg px-2'>Balance :</button>
            <h2 className='rounded-lg bg-[#00344B] text-gray-300 py-2 px-6'>{balance}</h2>
            <svg xmlns="http://www.w3.org/2000/svg" onClick={getBalance} className="h-7 w-7 cursor-pointer pl-2" fill="none" viewBox="0 0 24 24" stroke="#38E8C6" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>}
        <div className='flex flex-col items-center text-white justify-center pt-28'>
          {!user.loggedIn ? <div className='flex flex-col justify-center items-center'>
            <img src='/whistle.svg' width={200} alt='nothing to see here' />
            <h1 className='pt-5 font-semibold text-gray-600'>Nothing to see here. Please connect your wallet</h1>
          </div>
            : <div className='flex bg-gray-900 rounded-lg shadow-lg px-5 py-7 flex-col space-y-5 w-1/3'>
              <div className='flex justify-between'>
                <h1 className='text-lg font-semibold text-gray-100 mb-2'>Transfer Tokens</h1>
                <img src='/planee.png' alt='plane' />
              </div>
              <div className='flex flex-col'>
                <label className='text-sm text-[#38E8C6]'>address</label>
                <input type="text" placeholder="recipient address"
                  className='px-4 py-2 focus:outline-none focus:border-[#38E8C6] focus:border-2 bg-gray-800 focus:border rounded-lg'
                  onChange={e => setRecipient(e.target.value)} />
              </div>
              <div className='flex flex-col pb-2'>
                <label className='text-sm text-[#38E8C6]'>amount</label>
                <input type="text" placeholder="amount"
                  className='px-4 py-2 focus:outline-none focus:border-[#38E8C6] focus:border-2 bg-gray-800 focus:border rounded-lg'
                  onChange={e => setAmount(e.target.value)} />
              </div>
              <button onClick={() => transferTokens(amount, recipient)}
                className='rounded-lg text-center text-sm font-bold text-blue-900 py-2 bg-[#38E8C6]'
              >Transfer Tokens</button>
            </div>}
        </div>
      </main>
      <footer>
        <img className="w-full" src='/city.svg' alt='city' />
        <div className='bg-black flex pt-10 pb-5 justify-center text-white'>
          <div className='w-[80%] flex justify-between items-center'>
            <div className='font-jet text-xs'>2022. All rights reserved.</div>
            <a className='flex items-center text-[#38E8C6] hover:underline hover:underline-offset-2 space-x-1 font-poppins text-lg' href='https://academy.ecdao.org/'><h1>Emerald</h1>
              <img src='/EC_Education.png' width={40} alt='city' />
              <h1>Academy</h1></a>
            <div className='font-jet text-xs'>Created by <a href='https://discord.gg/emeraldcity' className='text-[#38E8C6] hover:underline hover:underline-offset-2 '>Emerald City DAO</a></div>
          </div>
        </div>
      </footer>
    </div>

  )
}


