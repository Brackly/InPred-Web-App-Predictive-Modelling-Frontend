import { createContext, useState } from "react";
import { useMutation, useQuery } from "react-query";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import useRefreshToken from "../../hooks/useRefresh";
import { BASEURL } from "../../API_URL/api";
import PropTypes from "prop-types";

const UserContext = createContext();

export const UserContextProvider = ({ children, fetchUser = true }) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const { userId } = state;
  const refreshAccessToken = useRefreshToken();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    "user",
    async () => {
      const accessToken = await refreshAccessToken();
      const { data } = await axios.get(`${BASEURL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data;
    },
    {
      enabled: fetchUser && !!state.accessToken,
      onSuccess: () => {},
      onError: (error) => {
        if (error.response?.status === 403 || error.response?.status === 401) {
          refreshAccessToken();
        }
      },
    }
  );

  const updateUser = useMutation(
    async (updatedUser) => {
      const accessToken = await refreshAccessToken();
      await axios.put(`${BASEURL}/user/${userId}`, updatedUser, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    {
      onSuccess: () => {
        refetch();
        setLoading(false);
      },
      onError: (error) => {
        console.log(error);
        setLoading(error);
      },
      onMutate: () => {
        setLoading(true);
      },
    }
  );

  if (isLoading) return <h1>Loading..</h1>;
  if (isError) {
    return <div>Error fetching user data</div>;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
      }}
    >
      {loading && <h1>LOADING...</h1>}
      {children}
    </UserContext.Provider>
  );
};

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  fetchUser: PropTypes.bool,
};

export default UserContext;
