module medblockss::medblock {
    use std::signer;
    use std::string;
    use std::vector;

    /// PatientVault stored under patient's account
    struct PatientVault has key {
        owner: address,
        encrypted_blob: string::String,
        iv: string::String,
        doctor_addrs: vector<address>,
        doctor_keys: vector<string::String>,
    }

    /// Register or update patient's encrypted blob (called by patient)
    /// Note: acquires annotation is required because we access global storage of PatientVault
    public entry fun register_or_update_patient_blob(
        patient: &signer,
        encrypted_blob: string::String,
        iv: string::String
    ) acquires PatientVault {
        let patient_addr = signer::address_of(patient);

        if (!exists<PatientVault>(patient_addr)) {
            let vault = PatientVault {
                owner: patient_addr,
                encrypted_blob,
                iv,
                doctor_addrs: vector::empty<address>(),
                doctor_keys: vector::empty<string::String>(),
            };
            move_to(patient, vault);
        } else {
            let vault_ref = borrow_global_mut<PatientVault>(patient_addr);
            // update fields
            vault_ref.encrypted_blob = encrypted_blob;
            vault_ref.iv = iv;
        };
    }

    /// Authorize a doctor — store or update their encrypted symmetric key
    public entry fun authorize_doctor(
        patient: &signer,
        doctor_addr: address,
        encrypted_sym_key_for_doctor: string::String
    ) acquires PatientVault {
        let patient_addr = signer::address_of(patient);
        // require that vault exists
        assert!(exists<PatientVault>(patient_addr), 1);

        let vault_ref = borrow_global_mut<PatientVault>(patient_addr);

        let len = vector::length(&vault_ref.doctor_addrs);
        let i = 0;
        while (i < len) {
            // compare addresses
            let existing = *vector::borrow(&vault_ref.doctor_addrs, i);
            if (existing == doctor_addr) {
                // replace the corresponding doctor key
                let key_ref = vector::borrow_mut(&mut vault_ref.doctor_keys, i);
                *key_ref = encrypted_sym_key_for_doctor;
                return;
            };
            i = i + 1;
        };
        // not found -> add
        vector::push_back(&mut vault_ref.doctor_addrs, doctor_addr);
        vector::push_back(&mut vault_ref.doctor_keys, encrypted_sym_key_for_doctor);
    }

    /// Anyone can check if a vault exists
    public fun has_vault(patient_addr: address): bool {
        exists<PatientVault>(patient_addr)
    }
}
