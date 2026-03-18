export const ENTER_DESTINATION_ADDRESS_PLACEHOLDER = 'Enter destination address';

export const getInvalidDestinationAddressMessage = (chainName: string): string => {
  return `The address entered is not a valid ${chainName} address`;
};
