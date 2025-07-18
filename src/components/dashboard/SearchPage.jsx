
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, User } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const SearchPage = ({ title, description, type = "key" }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [filters, setFilters] = useState({
    gender: "",
    religion: "",
    occupation: "",
    education: "",
    income: "",
  });

  // Mock profile data
  const mockProfiles = [
    {
      id: "P-1001",
      name: "Priya Sharma",
      age: 28,
      gender: "Female",
      occupation: "Software Engineer",
      education: "Masters in Computer Science",
      location: "Mumbai, Maharashtra",
      religion: "Hindu",
      photo: "https://ui-avatars.com/api/?name=Priya+Sharma&background=random"
    },
    {
      id: "P-1002",
      name: "Rahul Mehta",
      age: 32,
      gender: "Male",
      occupation: "Doctor",
      education: "MBBS, MD",
      location: "Delhi, Delhi",
      religion: "Hindu",
      photo: "https://ui-avatars.com/api/?name=Rahul+Mehta&background=random"
    },
    {
      id: "P-1003",
      name: "Ananya Patel",
      age: 27,
      gender: "Female",
      occupation: "Chartered Accountant",
      education: "CA, BCom",
      location: "Ahmedabad, Gujarat",
      religion: "Jain",
      photo: "https://ui-avatars.com/api/?name=Ananya+Patel&background=random"
    },
    {
      id: "P-1004",
      name: "Vikram Singh",
      age: 30,
      gender: "Male",
      occupation: "Business Analyst",
      education: "MBA Finance",
      location: "Bangalore, Karnataka",
      religion: "Sikh",
      photo: "https://ui-avatars.com/api/?name=Vikram+Singh&background=random"
    },
    {
      id: "P-1005",
      name: "Nisha Reddy",
      age: 26,
      gender: "Female",
      occupation: "Marketing Manager",
      education: "MBA Marketing",
      location: "Hyderabad, Telangana",
      religion: "Hindu",
      photo: "https://ui-avatars.com/api/?name=Nisha+Reddy&background=random"
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    
    setIsSearching(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      setSearchResults(mockProfiles);
      setIsSearching(false);
    }, 1000);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      gender: "",
      religion: "",
      occupation: "",
      education: "",
      income: "",
    });
    setAgeRange([18, 50]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{type === "key" ? "Key Search" : type === "special" ? "Special Search" : "Advanced Search"}</CardTitle>
              <CardDescription>
                {type === "key" 
                  ? "Search profiles using key parameters" 
                  : type === "special" 
                  ? "Search using special criteria and preferences" 
                  : "Use advanced filters and parameters to find perfect matches"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch}>
                {/* Main search field */}
                <div className="mb-6">
                  <Label htmlFor="search" className="mb-2 block">Search by ID, Name or Keyword</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search" 
                      placeholder={`${type === "key" ? "Enter ID, name or keyword" : "Enter search criteria"}`} 
                      className="pl-10" 
                    />
                  </div>
                </div>

                {/* Filters section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Filters
                    </h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground"
                    >
                      <X className="h-3 w-3 mr-1" /> Clear All
                    </Button>
                  </div>

                  {/* Age Range */}
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <div className="pt-4 pb-2">
                      <Slider 
                        defaultValue={ageRange} 
                        min={18} 
                        max={70} 
                        step={1} 
                        value={ageRange}
                        onValueChange={setAgeRange}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{ageRange[0]} years</span>
                      <span>{ageRange[1]} years</span>
                    </div>
                  </div>

                  {/* Filter Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={filters.gender} onValueChange={(value) => handleFilterChange("gender", value)}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Religion */}
                    <div className="space-y-2">
                      <Label htmlFor="religion">Religion</Label>
                      <Select value={filters.religion} onValueChange={(value) => handleFilterChange("religion", value)}>
                        <SelectTrigger id="religion">
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hindu">Hindu</SelectItem>
                          <SelectItem value="muslim">Muslim</SelectItem>
                          <SelectItem value="christian">Christian</SelectItem>
                          <SelectItem value="sikh">Sikh</SelectItem>
                          <SelectItem value="jain">Jain</SelectItem>
                          <SelectItem value="buddhist">Buddhist</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Occupation */}
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Select value={filters.occupation} onValueChange={(value) => handleFilterChange("occupation", value)}>
                        <SelectTrigger id="occupation">
                          <SelectValue placeholder="Select occupation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="it">IT Professional</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="engineer">Engineer</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Education */}
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Select value={filters.education} onValueChange={(value) => handleFilterChange("education", value)}>
                        <SelectTrigger id="education">
                          <SelectValue placeholder="Select education" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                          <SelectItem value="masters">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Income */}
                    <div className="space-y-2">
                      <Label htmlFor="income">Income Range</Label>
                      <Select value={filters.income} onValueChange={(value) => handleFilterChange("income", value)}>
                        <SelectTrigger id="income">
                          <SelectValue placeholder="Select income range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-5l">₹0 - ₹5 Lakhs</SelectItem>
                          <SelectItem value="5l-10l">₹5 - ₹10 Lakhs</SelectItem>
                          <SelectItem value="10l-15l">₹10 - ₹15 Lakhs</SelectItem>
                          <SelectItem value="15l-25l">₹15 - ₹25 Lakhs</SelectItem>
                          <SelectItem value="25l+">Above ₹25 Lakhs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="City, State or Country" />
                    </div>
                  </div>

                  {/* Additional advanced filters for Advanced Search type */}
                  {type === "adv" && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-4">Preferences</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Checkboxes for preferences */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="horoscope" />
                            <Label htmlFor="horoscope">Match Horoscope</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="diet" />
                            <Label htmlFor="diet">Same Food Preferences</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="drinking" />
                            <Label htmlFor="drinking">Non-Drinker</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="smoking" />
                            <Label htmlFor="smoking">Non-Smoker</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="photo" />
                            <Label htmlFor="photo">Photo Available</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="verified" />
                            <Label htmlFor="verified">Verified Profiles Only</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="mt-6">
                  <Button type="submit" className="w-full" disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search Profiles"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults.length} profiles found matching your criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((profile) => (
                    <div key={profile.id} className="border rounded-lg p-4 hover-effect">
                      <div className="flex items-center">
                        <div className="h-20 w-20 rounded-full overflow-hidden mr-4">
                          <img 
                            src={profile.photo} 
                            alt={profile.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium flex items-center">
                              {profile.name} 
                              <Badge className="ml-2" variant="secondary">
                                {profile.id}
                              </Badge>
                            </h3>
                            <Badge>{profile.religion}</Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {profile.age} years • {profile.gender} • {profile.location}
                          </p>
                          <p className="text-sm mt-1">
                            {profile.education} • {profile.occupation}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" size="sm">Save</Button>
                        <Button size="sm">View Profile</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No profiles found</h3>
                  <p className="mt-1 text-muted-foreground">
                    Try adjusting your search filters to find more matches
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Searches</CardTitle>
              <CardDescription>
                Access your previously saved searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No saved searches yet</h3>
                <p className="mt-1 text-muted-foreground">
                  Save your searches to quickly access them later
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchPage;
