import React, { useState, useEffect, useCallback } from "react";
import { Loader, Card, Text, Group, Image, Badge, useMantineTheme, useMantineColorScheme } from "@mantine/core";
import { toast } from "sonner";
import { getData } from "../../../store/httpservice";
import { FiHeart } from "react-icons/fi";

const EmpCustomerInterests = ({ user_id }) => {
  const [sentInterests, setSentInterests] = useState([]);
  const [receivedInterests, setReceivedInterests] = useState([]);
  const [matchedInterests, setMatchedInterests] = useState([]);
  const [rejectedInterests, setRejectedInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [interestsError, setInterestsError] = useState(null);

  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define a custom color palette that adapts to dark mode
  const colors = {
    primaryRose: isDarkMode ? theme.colors.pink[4] : '#E0115F',
    lightRose: isDarkMode ? theme.colors.dark[8] : '#FFF0F5',
    softRose: isDarkMode ? theme.colors.dark[7] : '#FFE4E1',
    darkText: isDarkMode ? theme.colors.gray[2] : '#4A4A4A',
    dimmedText: isDarkMode ? theme.colors.gray[4] : '#7A7A7A',
    status: {
      accepted: theme.colors.green[6],
      rejected: theme.colors.red[6],
      pending: theme.colors.orange[5],
      matched: theme.colors.green[6],
    },
    badgeText: '#FFFFFF',
    initialsBg: isDarkMode ? theme.colors.dark[6] : '#E0BBE4',
    initialsText: isDarkMode ? theme.colors.gray[0] : '#8E44AD'
  };

  // Fetch interests
  const fetchInterests = useCallback(async () => {
    setLoadingInterests(true);
    setInterestsError(null);
    try {
      const response = await getData(`/employee/customer/interests/${user_id}/`);
      console.log("Interests response:", response);
      setSentInterests(response.data.sent_interests || []);
      setReceivedInterests(response.data.received_interests || []);
      setMatchedInterests(response.data.matched_interests || []);
      setRejectedInterests(response.data.rejected_interests || []);
    } catch (err) {
      console.error("Failed to fetch interests:", err);
      setInterestsError("Failed to load interests. Please try again.");
      toast.error("Failed to load interests. Please try again.");
    } finally {
      setLoadingInterests(false);
    }
  }, [user_id]);

  useEffect(() => {
    if (user_id) {
      fetchInterests();
    } else {
      setInterestsError("Invalid customer ID.");
      setLoadingInterests(false);
    }
  }, [fetchInterests, user_id]);

  // Get initials for profile picture placeholder
  const getInitials = (name) => {
    if (!name) return "NA";
    const words = name.split(" ").filter(Boolean);
    if (words.length === 0) return "NA";
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Render Interests Section
  const renderInterestsSection = (title, interests, type) => {
    return (
      <div className="mb-8" style={{ color: colors.darkText }}>
        <Text
          size="xl"
          fw={700}
          className="mb-4 pb-2 flex items-center"
          style={{ color: colors.primaryRose, borderBottom: `2px solid ${colors.softRose}` }}
        >
          <FiHeart className="mr-2" style={{ color: colors.primaryRose }} />
          {title} Interests
        </Text>
        {loadingInterests ? (
          <div className="flex justify-center py-4">
            <Loader color={colors.primaryRose} size="md" type="dots" />
          </div>
        ) : interestsError ? (
          <Text c="red" size="sm" style={{ color: theme.colors.red[7] }}>
            {interestsError}
          </Text>
        ) : interests.length === 0 ? (
          <Text c="dimmed" size="sm" style={{ color: colors.dimmedText }}>
            No {title.toLowerCase()} interests found.
          </Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interests.map((interest, index) => {
              let person;
              let status = interest.status || "pending";
              let statusText = status;

              if (type === "matched") {
                person = interest.customer;
                status = "matched";
                statusText = "matched";
              } else if (type === "rejected") {
                person = interest.profile;
                status = interest.customer?.user_id === user_id ? "rejected_by_you" : "rejected";
                statusText = interest.customer?.user_id === user_id
                  ? `You rejected ${person?.name || person?.user_id || "Unknown"}`
                  : `${person?.name || person?.user_id || "Unknown"} rejected you`;
              } else {
                person = type === "sent" ? interest.profile : interest.customer;
              }

              if (!person) {
                console.warn(`No person data for ${type} interest at index ${index}:`, interest);
                return null;
              }

              const name = person.name || person.user_id || "Unknown";
              const id = person.user_id || "N/A";
              const age = person.age || "N/A";
              const profilePic = person.profile_photos || null;
              const date = interest.created_at;

              const getStatusColor = (s) => {
                const lowerStatus = s.toLowerCase();
                if (lowerStatus === "accepted") return colors.status.accepted;
                if (lowerStatus === "rejected" || lowerStatus === "rejected_by_you") return colors.status.rejected;
                if (lowerStatus === "matched") return colors.status.matched;
                return colors.status.pending;
              };

              return (
                <Card
                  key={`${type}-${index}`}
                  shadow="sm"
                  padding="md"
                  radius="md"
                  withBorder
                  className="transition-all duration-300"
                  style={{
                    backgroundColor: colors.lightRose,
                    borderColor: colors.softRose,
                    minHeight: "120px",
                    cursor: 'pointer',
                    boxShadow: theme.shadows.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                    e.currentTarget.style.borderColor = colors.primaryRose;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.borderColor = colors.softRose;
                  }}
                >
                  <Group align="center" wrap="nowrap">
                    {/* Profile Picture or Initials */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden">
                      {profilePic ? (
                        <Image
                          src={`${import.meta.env.VITE_BASE_MEDIA_URL}${profilePic}`}
                          alt={`${name}'s profile`}
                          radius="full"
                          width={56}
                          height={56}
                          fit="cover"
                          className="rounded-full"
                          style={{ 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            minWidth: '56px',
                            minHeight: '56px'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg"
                          style={{ backgroundColor: colors.initialsBg, color: colors.initialsText }}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1">
                      <Group position="apart">
                        <Text fw={500} size="md" style={{ color: colors.primaryRose }}>
                          {name} ({id})
                        </Text>
                        <Badge
                          color={getStatusColor(status)}
                          variant="light"
                          size="sm"
                          className="capitalize"
                          style={{ color: getStatusColor(status), backgroundColor: `${getStatusColor(status)}1A` }}
                        >
                          {statusText}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed" style={{ color: colors.dimmedText }}>
                        Age: {age}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ color: colors.dimmedText }}>
                        Date: {formatDate(date)}
                      </Text>
                    </div>
                  </Group>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: isDarkMode ? theme.colors.dark[9] : colors.lightRose }}>
      {renderInterestsSection("Sent", sentInterests, "sent")}
      {renderInterestsSection("Received", receivedInterests, "received")}
      {renderInterestsSection("Matched", matchedInterests, "matched")}
      {renderInterestsSection("Rejected", rejectedInterests, "rejected")}
    </div>
  );
};

export default EmpCustomerInterests;