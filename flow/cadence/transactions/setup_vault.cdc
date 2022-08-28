// This transaction is a template for a transaction
// to add a Vault resource to their account
// so that they can use the exampleToken
import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

transaction() {

    prepare(signer: AuthAccount) {
        /* 
            NOTE: In any normal DApp, you would NOT DO these next 3 lines. You would never want to destroy
            someone's vault if it's already set up. The only reason we do this for the
            tutorial is because there's a chance that, on testnet, someone already has 
            a vault here and it will mess with the tutorial.
        */
        destroy signer.load<@FungibleToken.Vault>(from: ExampleToken.VaultStoragePath)
        signer.unlink(ExampleToken.VaultReceiverPath)
        signer.unlink(ExampleToken.VaultBalancePath)

        // These next lines are the only ones you would normally do.
        if signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath) == nil {
            // Create a new ExampleToken Vault and put it in storage
            signer.save(<-ExampleToken.createEmptyVault(), to: ExampleToken.VaultStoragePath)

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(ExampleToken.VaultReceiverPath, target: ExampleToken.VaultStoragePath)

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(ExampleToken.VaultBalancePath, target: ExampleToken.VaultStoragePath)
        }
    }
}
 