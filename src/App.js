import React, { useState } from 'react'

import TruSDK from '@tru_id/tru-sdk-react-native'

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const App = () => {
  const baseURL = '<YOUR_LOCAL_TUNNEL_URL>'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const errorHandler = ({ title, message }) => {
    return Alert.alert(title, message, [
      {
        text: 'Close',
        onPress: () => console.log('Alert closed'),
      },
    ])
  }

  const successHandler = () =>
    Alert.alert('Login Successful', '✅', [
      {
        text: 'Close',
        onPress: () => console.log('Alert closed'),
      },
    ])

  const createSIMCheck = async (phoneNumber) => {
    const body = { phone_number: phoneNumber }

    console.log('tru.ID: Creating SIMCheck for', body)

    const response = await fetch(`${baseURL}/sim-check`, {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    return json
  }

  const loginHandler = async () => {
    setLoading(true)
    // check if we have coverage using the `isReachable` function

    const reachabilityDetails = await TruSDK.isReachable()

    console.log('Reachability details are', reachabilityDetails)

    const info = JSON.parse(reachabilityDetails)

    if (info.error.status === 400) {
      errorHandler({
        title: 'Something went wrong.',
        message: 'Mobile Operator not supported',
      })
      setLoading(false)
      return
    }

    let isPhoneCheckSupported = false

    if (info.error.status !== 412) {
      isPhoneCheckSupported = false

      for (const { product_name } of info.products) {
        console.log('supported products are', product_name)

        if (product_name === 'Sim Check') {
          isPhoneCheckSupported = true
        }
      }
    } else {
      isPhoneCheckSupported = true
    }

    // If the SIMCheck API is supported, proceed with SIMCheck verification

    if (isSIMCheckSupported) {
    } else {
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image style={styles.logo} source={require('./images/tru-logo.png')} />
        <Text style={styles.heading}>Login</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Number ex. +448023432345"
          placeholderTextColor="#d3d3d3"
          keyboardType="phone-pad"
          value={phoneNumber}
          editable={!loading}
          onChangeText={(value) => setPhoneNumber(value.replace(/\s+/g, ''))}
        />
        {loading ? (
          <ActivityIndicator
            style={styles.spinner}
            size="large"
            color="#00ff00"
          />
        ) : (
          <TouchableOpacity onPress={loginHandler} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginTop: 10,
    width: 0.5 * Dimensions.get('window').width,
    height: 200,
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    padding: 15,
    borderRadius: 3,
    backgroundColor: '#fff',
    borderColor: '#858585',
    borderWidth: 0.4,
    elevation: 7,
    marginBottom: 10,
    shadowColor: '#858585',
    shadowOffset: { width: 0.5, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    color: '#000',
    width: 0.7 * Dimensions.get('window').width,
  },
  spinner: {
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1955ff',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1955ff',
    marginTop: 17,
    width: 0.35 * Dimensions.get('window').width,
  },
  buttonText: {
    color: '#fff',
  },
})

export default App
