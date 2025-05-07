import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHashchain } from "../context/HashChainContext";
import type { VendorData, HashchainData } from "@src/pages/background/types";

interface FormData {
  vendorAddress: string;
  chainId: string;
  amountPerHash: string;
  secret: string;
  numHashes: string;
}

interface FormErrors {
  vendorAddress?: string;
  chainId?: string;
  amountPerHash?: string;
  secret?: string;
  numHashes?: string;
  submit?: string;
}

const GenerateHash: React.FC = () => {
  const { createHashchain, updateHashchain } = useHashchain();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    vendorAddress: "",
    chainId: "",
    amountPerHash: "",
    secret: "",
    numHashes: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.vendorAddress.trim()) {
      newErrors.vendorAddress = "Vendor address is required";
    }
    
    if (!formData.chainId.trim()) {
      newErrors.chainId = "Chain ID is required";
    }
    
    if (!formData.amountPerHash.trim()) {
      newErrors.amountPerHash = "Amount per hash is required";
    } else if (isNaN(parseFloat(formData.amountPerHash))) {
      newErrors.amountPerHash = "Amount must be a valid number";
    }
    
    if (!formData.secret.trim()) {
      newErrors.secret = "Secret is required";
    }
    
    if (!formData.numHashes.trim()) {
      newErrors.numHashes = "Number of hashes is required";
    } else if (isNaN(parseInt(formData.numHashes)) || parseInt(formData.numHashes) < 1) {
      newErrors.numHashes = "Number of hashes must be a positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const vendorData: VendorData = {
        vendorAddress: formData.vendorAddress,
        chainId: formData.chainId,
        amountPerHash: formData.amountPerHash
      };

      // Create hashchain
      const hashchainId = await createHashchain(vendorData, formData.secret);
      
      // Update with numHashes
      await updateHashchain(hashchainId, {
        numHashes: formData.numHashes
      });

      // Reset form and navigate
      setFormData({
        vendorAddress: "",
        chainId: "",
        amountPerHash: "",
        secret: "",
        numHashes: "",
      });
      navigate("/manage");
    } catch (error) {
      console.error("Failed to create hashchain:", error);
      setErrors(prev => ({
        ...prev,
        submit: "Failed to create hashchain. Please try again."
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    name: keyof FormData,
    label: string,
    type: string = "text",
    placeholder: string = ""
  ) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-200">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full p-2 bg-gray-800 border ${
          errors[name] ? 'border-red-500' : 'border-gray-600'
        } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      />
      {errors[name] && (
        <p className="text-sm text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-gray-900 rounded-lg shadow-md space-y-4"
    >
      {renderInput("vendorAddress", "Vendor Address", "text", "Enter vendor address")}
      {renderInput("chainId", "Chain ID", "text", "Enter chain ID")}
      {renderInput("amountPerHash", "Amount per Hash", "text", "Enter amount per hash")}
      {renderInput("secret", "Secret", "text", "Enter secret")}
      {renderInput("numHashes", "Number of Hashes", "number", "Enter number of hashes")}

      {errors.submit && (
        <p className="text-sm text-red-500 text-center">{errors.submit}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md 
          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'} 
          focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      >
        {isSubmitting ? 'Creating...' : 'Create hash chain'}
      </button>
    </form>
  );
};

export default GenerateHash;