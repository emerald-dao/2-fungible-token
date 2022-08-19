// This script reads the balance field of an account's FlowToken Balance
import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

pub fun main(account: Address): UFix64 {
    let vaultRef = getAccount(account).getCapability(ExampleToken.VaultBalancePath)
                    .borrow<&ExampleToken.Vault{FungibleToken.Balance}>()
                    ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}