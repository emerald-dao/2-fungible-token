// This transaction is a template for a transaction
// to add a Vault resource to their account
// so that they can use the exampleToken
import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

transaction() {

    prepare(signer: AuthAccount) {
        // Only setup if they aren't setup already.
        if signer.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault) == nil {
            // Create a new ExampleToken Vault and put it in storage
            signer.save(
                <-ExampleToken.createEmptyVault(),
                to: /storage/ExampleTokenVault
            )

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                /public/ExampleTokenReceiver,
                target: /storage/ExampleTokenVault
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                /public/ExampleTokenBalance,
                target: /storage/ExampleTokenVault
            )
        }
    }
}