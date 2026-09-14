import React, { useState, useEffect } from 'react';
import { Select, Button, MultiSelect, ActionIcon } from '@mantine/core';
import { IconSearch, IconMapPin, IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { regions, provinces, cities } from 'select-philippines-address';
import { useNavigate } from 'react-router-dom';

const availableAmenities = [
  'Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home System',
  'Rooftop Terrace', 'Spa Retreat', 'Concierge Service', 'Private Elevator',
  'Sky Lounge', 'Fitness Center', 'Helipad Access', 'Private Beach Access',
  'Outdoor Kitchen', 'Guest Casita', 'Boat Mooring', 'Tennis Court',
  'Multi-car Garage'
];

export default function AdvancedSearchBox({ onSearch, isSticky }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('Buy');
  const [location, setLocation] = useState(''); // Generic keyword
  const [propertyType, setPropertyType] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState([]);
  
  // Philippine Location States
  const [regionData, setRegionData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [cityData, setCityData] = useState([]);
  
  const [selectedRegion, setSelectedRegion] = useState(''); 
  const [selectedProvince, setSelectedProvince] = useState(''); 
  const [selectedCity, setSelectedCity] = useState(''); 

  const [regionName, setRegionName] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');

  // Fetch Regions on mount
  useEffect(() => {
    regions().then(response => {
      setRegionData(response.map(r => ({ value: r.region_code, label: r.region_name })));
    });
  }, []);

  const handleRegionChange = (val) => {
    setSelectedRegion(val);
    setSelectedProvince('');
    setSelectedCity('');
    setProvinceName('');
    setCityName('');
    
    if (val) {
      const name = regionData.find(r => r.value === val)?.label;
      setRegionName(name || '');
      provinces(val).then(response => {
        setProvinceData(response.map(p => ({ value: p.province_code, label: p.province_name })));
      });
    } else {
      setRegionName('');
      setProvinceData([]);
    }
  };

  const handleProvinceChange = (val) => {
    setSelectedProvince(val);
    setSelectedCity('');
    setCityName('');
    
    if (val) {
      const name = provinceData.find(p => p.value === val)?.label;
      setProvinceName(name || '');
      cities(val).then(response => {
        setCityData(response.map(c => ({ value: c.city_code, label: c.city_name })));
      });
    } else {
      setProvinceName('');
      setCityData([]);
    }
  };

  const handleCityChange = (val) => {
    setSelectedCity(val);
    if (val) {
      const name = cityData.find(c => c.value === val)?.label;
      setCityName(name || '');
    } else {
      setCityName('');
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ 
        mode,
        location, 
        propertyType, 
        minPrice, 
        maxPrice, 
        beds, 
        baths, 
        parking, 
        amenities,
        region: regionName,
        province: provinceName,
        city: cityName
      });
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderRadius: isSticky ? '0px' : '40px',
        maxWidth: isSticky ? '100%' : '64rem' 
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      whileHover={{ y: isSticky ? 0 : -4, boxShadow: "0px 12px 30px rgba(23,72,73,0.1)" }}
      className={`w-full mx-auto bg-white shadow-[0px_4px_12px_rgba(23,72,73,0.05)] border border-[#E5E7EB] flex flex-col gap-4 relative z-20 ${isSticky ? 'px-5 md:px-10 lg:px-20 py-4 border-t-0 border-x-0' : 'p-4'}`}
    >
      
      {/* Mode Switcher */}
      <div className={`flex justify-start ${isSticky ? 'max-w-[1440px] mx-auto w-full' : 'mb-2 px-2'}`}>
        <div className="bg-[#F1F0EC] p-1 rounded-full flex gap-1">
          {['Buy', 'Sell', 'Rent'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2 rounded-full text-[12px] uppercase tracking-widest font-bold transition-all h-[36px] ${mode === m ? 'bg-[#174849] text-white shadow-md' : 'text-[#174849] hover:bg-[#E5E7EB]'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Row */}
      <div className={`flex flex-col md:flex-row items-center gap-4 ${isSticky ? 'max-w-[1440px] mx-auto w-full' : ''}`}>
        
        {mode === 'Sell' ? (
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="flex-1 w-full relative">
              <motion.div 
                whileFocus={{ scale: 1.01 }}
                className="flex items-center bg-[#F1F0EC] rounded-full px-4 h-[54px] border-2 border-transparent focus-within:border-[#266F71] transition-colors"
              >
                <IconMapPin size={22} className="text-[#174849] opacity-70 mr-2" />
                <input
                  type="text"
                  placeholder="Enter Address for CMA Valuation"
                  className="w-full bg-transparent outline-none border-none text-[#1B1C1A] h-[54px] text-[16px] font-manrope"
                />
              </motion.div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-none w-full md:w-auto">
              <Button
                onClick={() => navigate('/valuation')}
                size="lg"
                className="w-full md:w-auto bg-[#FB8E5D] hover:bg-[#e07a4a] text-white rounded-full font-manrope font-bold tracking-widest text-[12px] uppercase px-8 h-[54px]"
              >
                Get Free Valuation
              </Button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* 1. Location (Keyword) */}
            <div className="flex-1 w-full relative">
              <motion.div 
                whileFocus={{ scale: 1.01 }}
                className="flex items-center bg-[#F1F0EC] rounded-full px-4 h-[54px] border-2 border-transparent focus-within:border-[#266F71] transition-colors"
              >
                <IconMapPin size={22} className="text-[#174849] opacity-70 mr-2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Keyword Search (City, Neighborhood)"
                  className="w-full bg-transparent outline-none border-none text-[#1B1C1A] h-[54px] text-[16px] font-manrope"
                />
              </motion.div>
            </div>

            {/* 2. Property Type */}
            <div className="w-full md:w-[200px]">
              <Select
                placeholder="Property Type"
                data={['All Types', 'House', 'Condo', 'Mansion', 'Estate', 'Penthouse', 'Townhouse', 'Land']}
                value={propertyType}
                onChange={setPropertyType}
                classNames={{
                  input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[16px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                }}
                clearable
              />
            </div>

            {/* 3. Price Range */}
            <div className="w-full md:w-[320px] flex gap-2">
              <Select
                placeholder="Min Price"
                value={minPrice}
                onChange={setMinPrice}
                data={[
                  { value: '5000000', label: '₱5,000,000' },
                  { value: '10000000', label: '₱10,000,000' },
                  { value: '25000000', label: '₱25,000,000' },
                  { value: '50000000', label: '₱50,000,000' },
                  { value: '100000000', label: '₱100,000,000' }
                ]}
                classNames={{
                  input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-4',
                }}
                clearable
              />
              <Select
                placeholder="Max Price"
                value={maxPrice}
                onChange={setMaxPrice}
                data={[
                  { value: '10000000', label: '₱10,000,000' },
                  { value: '25000000', label: '₱25,000,000' },
                  { value: '50000000', label: '₱50,000,000' },
                  { value: '100000000', label: '₱100,000,000' },
                  { value: '250000000', label: '₱250,000,000' },
                  { value: '500000000', label: '₱500,000,000+' }
                ]}
                classNames={{
                  input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-4',
                }}
                clearable
              />
            </div>

            {/* 4. Search Button & Toggle */}
            <div className="w-full md:w-auto flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ActionIcon 
                  size={54} 
                  variant={showAdvanced ? "filled" : "light"} 
                  color="#266F71"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="rounded-full bg-[#F1F0EC] hover:bg-[#E5E7EB]"
                  style={showAdvanced ? { backgroundColor: '#266F71', color: 'white' } : {}}
                  title="Toggle Advanced Filters"
                >
                  <IconAdjustmentsHorizontal size={24} />
                </ActionIcon>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
                <Button
                  onClick={handleSearch}
                  leftSection={<IconSearch size={20} />}
                  size="lg"
                  className="w-full md:w-auto bg-[#174849] hover:bg-[#103536] text-white rounded-full font-manrope font-bold tracking-widest text-[12px] uppercase px-8 h-[54px]"
                >
                  Search
                </Button>
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Expanded Advanced Filters Row */}
      <AnimatePresence>
        {showAdvanced && mode !== 'Sell' && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`overflow-hidden ${isSticky ? 'max-w-[1440px] mx-auto w-full' : ''}`}
          >
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col gap-4 mt-2 pb-2">
              
              {/* Philippine Locations Row */}
              <div className="flex flex-col lg:flex-row gap-4">
                <Select
                  placeholder="Region"
                  value={selectedRegion}
                  onChange={handleRegionChange}
                  data={regionData}
                  searchable
                  clearable
                  className="flex-1"
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                />
                <Select
                  placeholder="Province"
                  value={selectedProvince}
                  onChange={handleProvinceChange}
                  data={provinceData}
                  searchable
                  clearable
                  disabled={!selectedRegion}
                  className="flex-1"
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                />
                <Select
                  placeholder="City/Municipality"
                  value={selectedCity}
                  onChange={handleCityChange}
                  data={cityData}
                  searchable
                  clearable
                  disabled={!selectedProvince}
                  className="flex-1"
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                />
              </div>

              {/* Property Details Row */}
              <div className="flex flex-col lg:flex-row gap-4">
               {/* Beds */}
               <Select
                  placeholder="Bedrooms"
                  value={beds}
                  onChange={setBeds}
                  data={[
                    { value: '1', label: '1+ Beds' },
                    { value: '2', label: '2+ Beds' },
                    { value: '3', label: '3+ Beds' },
                    { value: '4', label: '4+ Beds' },
                    { value: '5', label: '5+ Beds' }
                  ]}
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                  clearable
                  className="w-full lg:w-[150px]"
                />

                {/* Baths */}
               <Select
                  placeholder="Bathrooms"
                  value={baths}
                  onChange={setBaths}
                  data={[
                    { value: '1', label: '1+ Baths' },
                    { value: '2', label: '2+ Baths' },
                    { value: '3', label: '3+ Baths' },
                    { value: '4', label: '4+ Baths' },
                    { value: '5', label: '5+ Baths' }
                  ]}
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                  clearable
                  className="w-full lg:w-[150px]"
                />

                {/* Parking */}
               <Select
                  placeholder="Parking"
                  value={parking}
                  onChange={setParking}
                  data={[
                    { value: '1', label: '1+ Spaces' },
                    { value: '2', label: '2+ Spaces' },
                    { value: '3', label: '3+ Spaces' },
                    { value: '4', label: '4+ Spaces' }
                  ]}
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] h-[54px] rounded-full px-5',
                  }}
                  clearable
                  className="w-full lg:w-[150px]"
                />

                {/* Amenities */}
                <MultiSelect
                  placeholder="Select Amenities"
                  data={availableAmenities}
                  value={amenities}
                  onChange={setAmenities}
                  searchable
                  clearable
                  hidePickedOptions
                  classNames={{
                    input: 'bg-[#F1F0EC] border-transparent focus:border-[#266F71] text-[14px] font-manrope text-[#1B1C1A] min-h-[54px] rounded-[24px] px-5',
                  }}
                  className="flex-1"
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
