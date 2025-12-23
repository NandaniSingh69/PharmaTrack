pragma solidity ^0.8.9;

library Types {
    enum AccountRole { Manufacturer, Distributor, Retailer, Customer }
    enum ItemType { Antibiotics, Antimalaria, Analgestics, Supplements, Steroids }

    struct AccountDetails {
        AccountRole role;
        address accountId;
        string name;
        string email;
    }

    struct AccountTransactions {
        address accountId;
        uint timestamp;
    }

    struct ItemHistory {
        AccountTransactions manufacturer;
        AccountTransactions distributor;
        AccountTransactions retailer;
        AccountTransactions[] customers;
    }

    struct Item {
        string name;
        string manufacturerName;
        address manufacturer;
        uint256 manufacturedDate;
        uint256 expiringDate;
        bool isInBatch;
        uint256 batchCount;
        string barcodeId;
        string itemImage;         // keep
        ItemType itemType;
        string usage;
        uint256 quantity;         // NEW: number of medicine units available
        string[] ingredients;     // NEW: list of ingredients for AI
    }
}
